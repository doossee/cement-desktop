import { createToast } from '@/lib/toast';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { downloadDir } from '@tauri-apps/api/path';
import { Client, Income, Purchase } from "./types";
import { PAYMENT_METHODS } from '@/utils/constants';
import { writeFiles } from 'tauri-plugin-clipboard-api';
import { mkdir, writeFile } from '@tauri-apps/plugin-fs';

pdfMake.vfs = pdfFonts.vfs;

export async function generateClientPDF(client: Client, purchases: Purchase[], incomes: Income[], start: Date, end: Date, clipboard?: boolean) {
  const docDefinition = {
    pageSize: 'A4', // Можно A3, A4, A5 и т. д.
    pageOrientation: 'landscape',
    content: [
      { text: `Mijoz: ${client.name}`, style: "subheader" },
      { text: `Telefon: ${client.phone || "Mavjud emas"}`, style: "subheader" },
      {
        text: [
          { text: "Balansi: ", style: "subheader", color: "black" },
          { 
            text: (client.balance - (client.initial_debt || 0)).toLocaleString('ru-RU'), 
            style: "subheader",
            color: (client.balance - (client.initial_debt || 0)) < 0 
              ? "#f54a00" 
              : (client.balance - (client.initial_debt || 0)) === 0 
              ? "black" 
              : "#008236"
          },
          { text: " so'm", style: "subheader", color: "black" }
        ],
      },
      // {
      //   text: CLIENT_TYPES[client.type], style: "subheader", color: "black"
      // },
      {
        text: client.initial_debt ? `${client.initial_debt_year} yilda qolgan qarzi: ${client.initial_debt.toLocaleString('ru-RU')} s'om` : '', style: "subheader", color: "black"
      },

      { text: "Chiqimlar", style: "sectionHeader" },
      {
        table: {
          headerRows: 1,
          widths: ["auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto"],
          body: [
            ["Sanasi", "Qop", "Qop narxi", "Sochma", "Sochma narxi", "Summasi", "Mashina xarajati", "Olgan naqd puli", "Jami summasi"],
            ...purchases
            .map((p) => [
                p.date ? new Date(p.date).toLocaleDateString() : "Jami: ",
                p.sack_num || "0",
                p.sack_price ? `${p.sack_price.toLocaleString('ru-RU')} ${ p?.currency ? "$" : "so'm" }` : "0",
                p.scatter_num || "0",
                p.scatter_price ? `${p.scatter_price.toLocaleString('ru-RU')} ${ p?.currency ? "$" : "so'm" }` : "0",
                `${p.sum_price?.toLocaleString('ru-RU') || 0} so'm`,
                p.car_cost ? `${p.car_cost.toLocaleString('ru-RU')} ${ p?.currency ? "$" : "so'm" }` : "0",
                p.other_cost ? `${p.other_cost.toLocaleString('ru-RU')} ${ p?.currency ? "$" : "so'm" }` : "0",
                `${p.total_price?.toLocaleString('ru-RU') || 0} so'm`,
            ]),
          ],
        },
        layout: "lightHorizontalLines",
      },

      { text: "Kirimlar", style: "sectionHeader", margin: [0, 5, 0, 5] },
      {
        table: {
          headerRows: 1,
          widths: ["auto", "auto", "auto", "auto"],
          body: [
            ["Sana", "To'lov summasi", "Valyuta kursi", "To'lov turi"],
            ...incomes
            .map((i) => [
                i.date ? new Date(i.date).toLocaleDateString() : "Jami: ",
                i.currency ? `${new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(i.amount || 0)} $ | ${new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(i.currency * (i.amount || 0))} so'm` :
                (i.amount?.toLocaleString('ru-RU') || 0) + " so'm",
                i.currency ? i.currency + " so'm" : "-",
                i.method ? PAYMENT_METHODS[i.method] : '-',
            ]),
          ],
        },
        layout: "lightHorizontalLines",
      },
    ],
    styles: {
      header: { fontSize: 16, bold: true, margin: [0, 0, 0, 5] },
      subheader: { fontSize: 12, bold: true, margin: [0, 0, 0, 5] },
      sectionHeader: { fontSize: 14, bold: true, margin: [0, 20, 0, 5] },
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