import { createToast } from '@/lib/toast';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { downloadDir } from '@tauri-apps/api/path';
import { Client, Income, Purchase } from "./types";
import { writeFiles } from 'tauri-plugin-clipboard-api';
import { mkdir, writeFile } from '@tauri-apps/plugin-fs';
import { PAYMENT_METHODS, CLIENT_TYPES } from '@/utils/constants';

pdfMake.vfs = pdfFonts.vfs;

export async function generateClientPDF(client: Client, purchases: Purchase[], incomes: Income[], start: Date, end: Date, clipboard?: boolean) {
  const docDefinition = {
    pageSize: 'A4', // Можно A3, A4, A5 и т. д.
    pageOrientation: 'landscape',
    content: [
      { text: `Mijoz: ${client.name}`, style: "header" },
      { text: `Telefon: ${client.phone || "Mavjud emas"}`, style: "header" },
      {
        text: [
          { text: "Balansi: ", style: "header", color: "black" },
          { 
            text: (client.balance - (client.initial_debt || 0)).toLocaleString('ru-RU'), 
            style: "header",
            color: (client.balance - (client.initial_debt || 0)) < 0 
              ? "#f54a00" 
              : (client.balance - (client.initial_debt || 0)) === 0 
              ? "black" 
              : "#008236"
          },
          { text: " so'm", style: "header", color: "black" }
        ],
      },
      // {
      //   text: CLIENT_TYPES[client.type], style: "subheader", color: "black"
      // },
      {
        text: client.initial_debt ? `Avvalgi qolgan qarzi: ${client.initial_debt.toLocaleString('ru-RU')} s'om` : '', style: "subheader", color: "black"
      },

      // { text: "Chiqimlar", style: "sectionHeader" },
      // {
      //   table: {
      //     headerRows: 1,
      //     widths: ["auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto"],
      //     body: [
      //       ["Sanasi", "Qop", "Qop narxi", "Sochma", "Sochma narxi", "Summasi", "Mashina xarajati", "Olgan naqd puli", "Jami summasi", "Haydovchi", "Izoh"],
      //       ...purchases
      //       .map((p) => [
      //           p.date ? new Date(p.date).toLocaleDateString() : "Jami: ",
      //           p.sack_num || "0",
      //           p.sack_price ? `${p.sack_price.toLocaleString('ru-RU')} ${ p?.currency ? "$" : "so'm" }` : "0",
      //           p.scatter_num || "0",
      //           p.scatter_price ? `${p.scatter_price.toLocaleString('ru-RU')} ${ p?.currency ? "$" : "so'm" }` : "0",
      //           `${p.sum_price?.toLocaleString('ru-RU') || 0} so'm`,
      //           p.car_cost ? `${p.car_cost.toLocaleString('ru-RU')} ${ p?.currency ? "$" : "so'm" }` : "0",
      //           p.other_cost ? `${p.other_cost.toLocaleString('ru-RU')} ${ p?.currency ? "$" : "so'm" }` : "0",
      //           `${p.total_price?.toLocaleString('ru-RU') || 0} so'm`,
      //           p.driver || "-",
      //           p.comment || "-",
      //       ]),
      //     ],
      //   },
      //   layout: "lightHorizontalLines",
      // },

      // { text: "Kirimlar", style: "sectionHeader", margin: [0, 5, 0, 5] },
      // {
      //   table: {
      //     headerRows: 1,
      //     widths: ["auto", "auto", "auto", "auto", "auto"],
      //     body: [
      //       ["Sana", "To'lov summasi", "Valyuta kursi", "To'lov turi", "Izoh"],
      //       ...incomes
      //       .map((i) => [
      //           i.date ? new Date(i.date).toLocaleDateString() : "Jami: ",
      //           i.currency ? `${new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(i.amount || 0)} $ | ${new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(i.currency * (i.amount || 0))} so'm` :
      //           (i.amount?.toLocaleString('ru-RU') || 0) + " so'm",
      //           i.currency ? i.currency + " so'm" : "-",
      //           i.method ? PAYMENT_METHODS[i.method] : '-',
      //           i.comment || "-",
      //       ]),
      //     ],
      //   },
      //   layout: "lightHorizontalLines",
      // },

      { text: "Chiqimlar", style: "sectionHeader" },
        {
            table: {
                headerRows: 1,
                widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', '*'],
                body: [
                    [
                        { text: "Sanasi", bold: true, alignment: 'center' },
                        { text: "Qop", bold: true, alignment: 'center' },
                        { text: "Qop narxi", bold: true, alignment: 'center' },
                        { text: "Sochma", bold: true, alignment: 'center' },
                        { text: "Sochma narxi", bold: true, alignment: 'center' },
                        { text: "Summasi", bold: true, alignment: 'center' },
                        { text: "Mashina xarajati", bold: true, alignment: 'center' },
                        { text: "Olgan naqd puli", bold: true, alignment: 'center' },
                        { text: "Jami summasi", bold: true, alignment: 'center' },
                        { text: "Haydovchi", bold: true, alignment: 'center' },
                        { text: "Izoh", bold: true, alignment: 'left' }
                    ],
                    ...purchases.map((p) => [
                        { text: p.date ? new Date(p.date).toLocaleDateString() : "Jami:", alignment: 'center' },
                        { text: p.sack_num || "0", alignment: 'center' },
                        { text: p.sack_price ? `${p.sack_price.toLocaleString('ru-RU')} ${ p?.currency ? "$" : "so'm" }` : "0", alignment: 'center' },
                        { text: p.scatter_num || "0", alignment: 'center' },
                        { text: p.scatter_price ? `${p.scatter_price.toLocaleString('ru-RU')} ${ p?.currency ? "$" : "so'm" }` : "0", alignment: 'center' },
                        { text: `${p.sum_price?.toLocaleString('ru-RU') || 0} so'm`, alignment: 'center' },
                        { text: p.car_cost ? `${p.car_cost.toLocaleString('ru-RU')} ${ p?.currency ? "$" : "so'm" }` : "0", alignment: 'center' },
                        { text: p.other_cost ? `${p.other_cost.toLocaleString('ru-RU')} ${ p?.currency ? "$" : "so'm" }` : "0", alignment: 'center' },
                        { text: `${p.total_price?.toLocaleString('ru-RU') || 0} so'm`, alignment: 'center' },
                        { text: p.driver || "-", alignment: 'center' },
                        { text: p.comment || "-", alignment: 'left' }
                    ])
                ]
            },
            layout: "lightHorizontalLines"
        },
        { text: "Kirimlar", style: "sectionHeader", margin: [0, 10, 0, 5] },
        {
            table: {
                headerRows: 1,
                widths: ['auto', 'auto', 'auto', 'auto', '*'],
                body: [
                    [
                        { text: "Sana", bold: true, alignment: 'center' },
                        { text: "To'lov summasi", bold: true, alignment: 'center' },
                        { text: "Valyuta kursi", bold: true, alignment: 'center' },
                        { text: "To'lov turi", bold: true, alignment: 'center' },
                        { text: "Izoh", bold: true, alignment: 'left' }
                    ],
                    ...incomes.map((i) => [
                        { text: i.date ? new Date(i.date).toLocaleDateString() : "Jami:", alignment: 'center' },
                        { text: i.currency ? `${new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(i.amount || 0)} $ | ${new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(i.currency * (i.amount || 0))} so'm` : (i.amount?.toLocaleString('ru-RU') || 0) + " so'm", alignment: 'center' },
                        { text: i.currency ? i.currency + " so'm" : "-", alignment: 'center' },
                        { text: i.method ? PAYMENT_METHODS[i.method] : '-', alignment: 'center' },
                        { text: i.comment || "-", alignment: 'left' }
                    ])
                ]
            },
            layout: "lightHorizontalLines"
        }
    ],
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 5] },
      subheader: { fontSize: 10, bold: true, margin: [0, 10, 0, 5] },
      sectionHeader: { fontSize: 14, bold: true, margin: [0, 20, 0, 5] },
    },
  };

  const pdfDoc = pdfMake.createPdf(docDefinition as any)
  const fileName = `${client.name}_${start.toLocaleDateString().replace(/\//g, '.')}-${end.toLocaleDateString().replace(/\//g, '.')}-${Date.now()}.pdf`;
  
  // pdfDoc.download(fileName);

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const download_dir = await downloadDir();
  const folderPath = `${download_dir}\\${today}-${String(CLIENT_TYPES[client.type]).toLowerCase().replace(/ /g, '-')}lar-xarajatlari`;
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