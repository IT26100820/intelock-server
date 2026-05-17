const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Intelock 2FA Server Running");
});

app.post("/ping", (req, res) => {

    console.log("ESP32 Data:", req.body);

    res.json({
        success: true,
        message: "ESP32 Connected Successfully"
    });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});