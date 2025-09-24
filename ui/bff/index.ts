import apiApp from "./api";

const PORT = Number(process.env.PORT) || 3002;

apiApp.listen(PORT)
console.log(`🚀 Server running at http://localhost:${PORT}`);