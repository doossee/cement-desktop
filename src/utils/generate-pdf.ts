import { createToast } from '@/lib/toast';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { downloadDir } from '@tauri-apps/api/path';
import { PAYMENT_METHODS } from '@/utils/constants';
import { writeFiles } from 'tauri-plugin-clipboard-api';
import { mkdir, writeFile } from '@tauri-apps/plugin-fs';
import { Client, Income, Purchase, AnnualExpenses } from "./types";

pdfMake.vfs = pdfFonts.vfs;

export async function generateClientPDF(client: Client, purchases: Purchase[], incomes: Income[], annual_expenses: AnnualExpenses[], start: Date, end: Date, clipboard?: boolean) {
  const docDefinition = {
    content: [
      { text: `Mijoz: ${client.name}`, style: "header" },
      { text: `Telefon: ${client.phone || "Mavjud emas"}`, style: "subheader" },
      {
        text: [
          { text: "Баланс: ", style: "subheader", color: "black" },
          { 
            text: `${client.balance} `, 
            style: "subheader",
            color: client.balance < 0 
              ? "#f54a00" 
              : client.balance === 0 
              ? "black" 
              : "#008236"
          },
          { text: "so'm", style: "subheader", color: "black" }
        ],
      },

      { text: "Yillik qarzlar", style: "sectionHeader", margin: [0, 10, 0, 10] },
      {
        table: {
          headerRows: 1,
          widths: ["auto", "auto", "auto", "auto"],
          body: [
            ["Yili", "Qazri", "To\'langan", "Qolgan qarzi"],
            ...annual_expenses.map((a) => [
                a.year,
                `${a.purchase} so'm`,
                `${a.income} so'm`,
                `${a.total} so'm`,
            ]),
          ],
        },
        layout: "lightHorizontalLines",
      },

      { text: "Chiqimlar", style: "sectionHeader" },
      {
        table: {
          headerRows: 1,
          widths: ["auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto"],
          body: [
            ["Sanasi", "Valyuta kursi", "Qop", "Qop narxi", "Sochma", "Sochma narxi", "Summasi", "Mashina xarajati", "Olgan naqd puli", "Jami summasi"],
            ...purchases.map((p) => [
                new Date(p.date).toLocaleDateString(),
                p.currency ? p.currency + " so'm" : "-",
                p.sack_num || "-",
                p.sack_price ? `${p.sack_price} ${ p.currency ? "$" : "so'm" }` : "-",
                p.scatter_num || "-",
                p.scatter_price ? `${p.scatter_price} ${ p.currency ? "$" : "so'm" }` : "-",
                `${p.sum_price} so'm`,
                p.car_cost ? `${p.car_cost} ${ p.currency ? "$" : "so'm" }` : "-",
                p.other_cost ? `${p.other_cost} ${ p.currency ? "$" : "so'm" }` : "-",
                `${p.total_price} so'm`,
            ]),
          ],
        },
        layout: "lightHorizontalLines",
      },

      { text: "Kirimlar", style: "sectionHeader", margin: [0, 10, 0, 10] },
      {
        table: {
          headerRows: 1,
          widths: ["auto", "auto", "auto", "auto"],
          body: [
            ["Sana", "To'lov summasi", "Valyuta kursi", "To'lov turi"],
            ...incomes.map((i) => [
                new Date(i.date).toLocaleDateString(),
                i.currency ? `${new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(i.amount || 0)} $ | ${new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(i.currency * (i.amount || 0))} so'm` :
                i.amount.toLocaleString('ru-RU') + " so'm",
                i.currency ? i.currency + " so'm" : "-",
                PAYMENT_METHODS[i.method],
            ]),
          ],
        },
        layout: "lightHorizontalLines",
      },
    ],
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      subheader: { fontSize: 14, bold: true, margin: [0, 0, 0, 5] },
      sectionHeader: { fontSize: 16, bold: true, margin: [0, 10, 0, 5] },
    },
  };
  const pdfDoc = pdfMake.createPdf(docDefinition as any)
  const fileName = `${client.name}_${start.toLocaleDateString().replace(/\//g, '.')}-${end.toLocaleDateString().replace(/\//g, '.')}-${Date.now()}.pdf`;
  
  // pdfDoc.download(fileName);

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const download_dir = await downloadDir();
  const folderPath = `${download_dir}\\${today}-xarajatlar`;
  const filePath = `${folderPath}\\${fileName}`;

  try {
    // Create the directory if it doesn't exist
    await mkdir(folderPath, { recursive: true });

    // Get the PDF buffer
    pdfDoc.getBlob(async (blob: Blob) => {
      const arrayBuffer = await blob.arrayBuffer();
      await writeFile(filePath, new Uint8Array(arrayBuffer)).catch((e) => {
        console.log(e)
      });
      
      createToast(`PDF fayl ${folderPath} papkada saqlandi`, 'SUCCESS');
    });
    
    // pdfDoc.download(`${today}-xarajatlar\\${fileName}`);

    if(clipboard) {
      console.log(filePath);
      await writeFiles([filePath]).catch(e => {
        console.error("PDF buffer error:", e);
        createToast('PDF faylni buferga joylashda xatolik yuz berdi!', 'WARNING')
      })
      createToast('PDF fayl buferga joylandi!', 'SUCCESS')
    }
  } catch(error) {
    console.error(":", error);
    createToast('PDF faylni yuklashda xatolik yuz berdi!', 'WARNING')
  }
}