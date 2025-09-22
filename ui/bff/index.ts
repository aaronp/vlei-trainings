import apiApp from "./api";

const PORT = Number(process.env.PORT) || 3001;

apiApp.listen(PORT)
console.log(`🚀 Server running at http://localhost:${PORT}`);