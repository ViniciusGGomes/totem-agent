import "dotenv/config";
import { FileService } from "./file/file.service.js";
import { PrintService } from "./print/print.service.js";
import { unlink } from "node:fs/promises";

async function main() {
  const fileService = new FileService();
  const printService = new PrintService();

  const objectKey = "026fb95b966783b84bf729530501d54a.jpg";

  try {
    // 1. Baixa do R2
    const filePath = await fileService.download(objectKey);

    // 2. Envia para impressora
    await printService.print(filePath);

    // Deleta impressão enviada
    await unlink(filePath);
    console.log("Process completed!");
  } catch (error) {
    console.error("Process failed:", error);
  }
}

main();
