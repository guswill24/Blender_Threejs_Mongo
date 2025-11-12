/**
 * Script de prueba para verificar que la API de scores funciona
 * Uso: node test-score-api.js
 */

const http = require("http");

const testPayload = {
  playerName: "Prueba",
  score: 10,
  level: 3,
  timeCompleted: 120,
};

const options = {
  hostname: "localhost",
  port: 3001,
  path: "/api/scores/final",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(JSON.stringify(testPayload)),
  },
};

console.log("📤 Enviando prueba a POST /api/scores/final...");
console.log("Payload:", testPayload);
console.log("");

const req = http.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log("📥 Respuesta recibida:");
    console.log("Status:", res.statusCode);
    console.log("Body:", data);

    try {
      const parsed = JSON.parse(data);
      if (parsed.success) {
        console.log("\n✅ ¡Éxito! El puntaje fue guardado en Mongo.");
        console.log("ID del documento:", parsed.data._id);
      } else {
        console.log("\n⚠️ Error:", parsed.message || "Error desconocido");
      }
    } catch (e) {
      console.log("\n❌ Error al parsear respuesta:", e.message);
    }
  });
});

req.on("error", (e) => {
  console.error("❌ Error de conexión:", e.message);
  console.log("Asegúrate de que:");
  console.log("1. El backend está corriendo: node app.js");
  console.log("2. MongoDB está corriendo en localhost:27017");
  console.log(
    "3. La variable MONGO_URI apunta a: mongodb://localhost:27017/loginDB"
  );
});

req.write(JSON.stringify(testPayload));
req.end();
