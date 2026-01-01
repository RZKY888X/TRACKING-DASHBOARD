const mqtt = require("mqtt");
const prisma = require("../lib/prisma");

function initMQTT() {
  if (!process.env.MQTT_BROKER_URL) {
    console.warn("MQTT_BROKER_URL not configured — MQTT client disabled.");
    return;
  }

  const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL);

  mqttClient.on("connect", () => {
    console.log("✅ Connected to MQTT Broker");
    const topics = (process.env.MQTT_TOPICS || "")
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    if (topics.length) {
      mqttClient.subscribe(topics);
    }
  });

  mqttClient.on("message", async (topic, message) => {
    try {
      const data = JSON.parse(message.toString());

      if (topic === "vehicle/position") {
        const vehicleId = Number(data.vehicleId);
        if (!vehicleId) return;

        await prisma.position.create({
          data: {
            vehicleId,
            latitude: Number(data.lat),
            longitude: Number(data.lng),
            speed: data.speed ? Number(data.speed) : null,
          },
        });
      }
    } catch (err) {
      console.error("MQTT error:", err);
    }
  });
}

module.exports = initMQTT;
