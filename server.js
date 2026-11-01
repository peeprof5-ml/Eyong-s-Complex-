/**
 * Eyong's Complex - Real-Time Server
 * Powered by Node.js, Express, and Socket.io
 * Coordinates live orders, pool bookings, menu updates, and site settings across browsers and devices.
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files from current directory
app.use(express.static(path.join(__dirname)));

// In-memory state store (persists while server runs)
let appState = {
    settings: {
        appName: "EYONG'S COMPLEX",
        appTagline: "CAMEROON'S PREMIER DINING, POOL & LOUNGE",
        currencySymbol: "FCFA",
        taxRate: 2.0,
        announcementText: "Welcome to Eyong's Complex! Reserve your infinity pool passes and fine Cameroonian dishes online.",
        showAnnouncement: true,
        enableMoMo: true,
        enableTracking: true,
        allowNotes: true,
        contactPhone: "+237 670 000 000",
        businessHours: "10:00 AM - 11:30 PM Daily"
    },
    sections: [
        { id: 'sec-all', name: 'All', type: 'standard', visible: true },
        { id: 'sec-delicacies', name: 'Local Delicacies', type: 'standard', visible: true },
        { id: 'sec-grill', name: 'Grill & Mains', type: 'standard', visible: true },
        { id: 'sec-pool', name: 'Pool Reservation', type: 'booking', visible: true },
        { id: 'sec-drinks', name: 'Drinks & Lounge', type: 'standard', visible: true }
    ],
    menu: [
        { id: 'cm1', name: 'Ndolé Royale Special', category: 'Local Delicacies', price: 12000, description: 'Fresh bitterleaf cooked with groundnuts, prawns, beef, and smoked fish. Served with Fried Plantains or Bobolo.', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', available: true },
        { id: 'cm2', name: 'Barbecue Capitaine Fish', category: 'Grill & Mains', price: 18000, description: 'Whole fresh Capitaine fish grilled with native spices, green pepper chili sauce, and fried plantain chips.', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80', available: true },
        { id: 'pool1', name: 'Luxury Pool Day Pass', category: 'Pool Reservation', price: 5000, description: 'Full day access to Eyong\'s infinity pool, towel service, access to sunbeds and pool bar. Price per person.', image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=600&q=80', available: true },
        { id: 'pool2', name: 'VIP Pool Cabana Slot', category: 'Pool Reservation', price: 15000, description: 'Private luxury cabana, complimentary fruit platter, poolside butler service. Price per person.', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80', available: true },
        { id: 'cm5', name: 'Palm Wine Gold Cocktail', category: 'Drinks & Lounge', price: 6000, description: 'Fresh natural palm wine infused with lemon, mint, gold glitter, and luxury Cameroonian rum.', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80', available: true }
    ],
    orders: []
};

// Socket.io Connection Handler
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Send initial state upon connection
    socket.emit('init_state', appState);

    // Handle new order or pool booking from customer site
    socket.on('submit_order', (order) => {
        appState.orders.unshift(order);
        console.log(`New Order/Booking received: ${order.id} (${order.type})`);
        // Broadcast to admin portal and other clients in real-time
        io.emit('new_order_received', order);
    });

    // Handle order status update from admin site
    socket.on('update_order_status', ({ orderId, status }) => {
        const order = appState.orders.find(o => o.id === orderId);
        if (order) {
            order.status = status;
            console.log(`Order ${orderId} status updated to: ${status}`);
            io.emit('order_status_updated', { orderId, status, orders: appState.orders });
        }
    });

    // Handle system settings, sections, or menu updates from admin site
    socket.on('update_system_state', (newState) => {
        if (newState.settings) appState.settings = newState.settings;
        if (newState.sections) appState.sections = newState.sections;
        if (newState.menu) appState.menu = newState.menu;

        console.log('System state updated by Admin.');
        // Broadcast updated state to all connected customers & admins
        io.emit('system_state_updated', appState);
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Eyong's Complex Real-Time Server running on port ${PORT}`);
});
