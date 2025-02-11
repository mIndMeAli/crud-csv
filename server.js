const express = require("express");
const fs = require("fs");
const cors = require("cors");
const axios = require("axios");
const bodyParser = require("body-parser");
const csvParser = require("csv-parser");
const { parse } = require("json2csv");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vToqsWJ2PdTbgLrea02uZUYYBfRMRJdtiQm6olvL8WO2AFYlYQ6QFiReMHYhH614KBMp7RsVF_R4jyp/pub?output=csv"; // Ganti dengan URL CSV Anda
const LOCAL_CSV = "DataPegawai.csv"; // File CSV untuk menyimpan data lokal

// 📌 1. GET: Ambil data dari Google Sheets (CSV)
app.get("/data", async (req, res) => {
    try {
        const response = await axios.get(CSV_URL);
        fs.writeFileSync(LOCAL_CSV, response.data);

        let results = [];
        fs.createReadStream(LOCAL_CSV)
            .pipe(csvParser())
            .on("data", (data) => results.push(data))
            .on("end", () => res.json(results));
    } catch (error) {
        res.status(500).json({ error: "Gagal mengambil data dari Google Sheets" });
    }
});

// 📌 2. POST: Tambah data ke CSV lokal
app.post("/data", (req, res) => {
    const newData = req.body;
    
    fs.appendFileSync(LOCAL_CSV, `\n${Object.values(newData).join(",")}`);
    res.json({ message: "Data berhasil ditambahkan", data: newData });
});

// 📌 3. PUT: Edit data berdasarkan ID
app.put("/data/:id", (req, res) => {
    const id = req.params.id;
    const updatedData = req.body;

    let results = [];
    fs.createReadStream(LOCAL_CSV)
        .pipe(csvParser())
        .on("data", (data) => results.push(data))
        .on("end", () => {
            let updatedCSV = results.map(row => row.ID === id ? { ...row, ...updatedData } : row);
            fs.writeFileSync(LOCAL_CSV, parse(updatedCSV));
            res.json({ message: "Data berhasil diperbarui", data: updatedData });
        });
});

// 📌 4. DELETE: Hapus data berdasarkan ID
app.delete("/data/:id", (req, res) => {
    const id = req.params.id;

    let results = [];
    fs.createReadStream(LOCAL_CSV)
        .pipe(csvParser())
        .on("data", (data) => results.push(data))
        .on("end", () => {
            let filteredCSV = results.filter(row => row.ID !== id);
            fs.writeFileSync(LOCAL_CSV, parse(filteredCSV));
            res.json({ message: "Data berhasil dihapus" });
        });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
