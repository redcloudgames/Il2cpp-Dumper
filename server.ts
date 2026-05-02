import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from 'url';
import { IL2CPPDumper } from "./src/lib/il2cpp.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB limit for GameAssembly
    }
});

async function startServer() {
    const app = express();
    const PORT = 3000;

    app.use(express.json());

    // API Routes
    app.post("/api/dump", upload.fields([
        { name: 'metadata', maxCount: 1 },
        { name: 'assembly', maxCount: 1 }
    ]), async (req: any, res) => {
        try {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            
            if (!files.metadata || !files.assembly) {
                return res.status(400).json({ error: "Both metadata and assembly files are required." });
            }

            const metadataBuffer = files.metadata[0].buffer;
            const assemblyBuffer = files.assembly[0].buffer;

            const dumper = new IL2CPPDumper(metadataBuffer, assemblyBuffer);
            const dumpResult = dumper.dump();

            res.json({
                success: true,
                dump: dumpResult
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error during dump processing." });
        }
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
}

startServer();
