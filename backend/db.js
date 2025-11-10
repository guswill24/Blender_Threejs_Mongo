import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/loginDB', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB conectado');
    } catch (err) {
        console.error('❌ Error al conectar MongoDB:', err.message);
        process.exit(1);
    }
};

export default connectDB;
