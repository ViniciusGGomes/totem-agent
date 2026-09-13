import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export class PrintService {
  async print(filePath: string): Promise<void> {
    console.log(`Printing file: ${filePath}`);

    const printerName = process.env.PRINTER_NAME;

    if (!printerName) {
      throw new Error("PRINTER_NAME environment variable is missing");
    }

    // Script PowerShell para carregar a imagem e desenhar no spooler do Windows
    const psScript = `
      Add-Type -AssemblyName System.Drawing;
      $p = New-Object System.Drawing.Printing.PrintDocument;
      $p.PrinterSettings.PrinterName = '${printerName}';
      $p.Add_PrintPage({
        param($s, $e)
        $img = [System.Drawing.Image]::FromFile('${filePath.replace(/\\/g, "/")}');
        $e.Graphics.DrawImage($img, 0, 0);
      });
      $p.Print();
    `.replace(/\n/g, "");

    try {
      await execFileAsync("powershell", [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        psScript,
      ]);

      console.log("Print job sent successfully!");
    } catch (error) {
      console.error("Failed to print file:", error);
      throw new Error("Could not send file to printer");
    }
  }
}
