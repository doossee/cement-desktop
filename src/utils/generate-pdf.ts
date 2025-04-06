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
  // const docDefinition = {
  //   pageSize: 'A4', // Можно A3, A4, A5 и т. д.
  //   pageOrientation: 'landscape',
  //   content: [
  //     { text: `Mijoz: ${client.name}`, style: "header" },
  //     { text: `Telefon: ${client.phone || "Mavjud emas"}`, style: "header" },
  //     {
  //       text: [
  //         { text: "Balansi: ", style: "header", color: "black" },
  //         { 
  //           text: (client.balance - (client.initial_debt || 0)).toLocaleString('ru-RU'), 
  //           style: "header",
  //           color: (client.balance - (client.initial_debt || 0)) < 0 
  //             ? "#f54a00" 
  //             : (client.balance - (client.initial_debt || 0)) === 0 
  //             ? "black" 
  //             : "#008236"
  //         },
  //         { text: " so'm", style: "header", color: "black" }
  //       ],
  //     },
  //     {
  //       text: client.initial_debt ? `Avvalgi qolgan qarzi: ${client.initial_debt.toLocaleString('ru-RU')} s'om` : '', style: "subheader", color: "black"
  //     },
  //     { text: "Chiqimlar", style: "sectionHeader" },
  //       {
  //           table: {
  //               headerRows: 1,
  //               widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', '*'],
  //               body: [
  //                   [
  //                       { text: "Sanasi", bold: true, alignment: 'center' },
  //                       { text: "Qop", bold: true, alignment: 'center' },
  //                       { text: "Qop narxi", bold: true, alignment: 'center' },
  //                       { text: "Sochma", bold: true, alignment: 'center' },
  //                       { text: "Sochma narxi", bold: true, alignment: 'center' },
  //                       { text: "Summasi", bold: true, alignment: 'center' },
  //                       { text: "Mashina xarajati", bold: true, alignment: 'center' },
  //                       { text: "Olgan naqd puli", bold: true, alignment: 'center' },
  //                       { text: "Jami summasi", bold: true, alignment: 'center' },
  //                       { text: "Haydovchi", bold: true, alignment: 'center' },
  //                       { text: "Izoh", bold: true, alignment: 'left' }
  //                   ],
  //                   ...purchases.map((p) => [
  //                       { text: p.date ? new Date(p.date).toLocaleDateString() : "Jami:", alignment: 'center' },
  //                       { text: p.sack_num || "0", alignment: 'center' },
  //                       { text: p.sack_price ? `${p.sack_price.toLocaleString('ru-RU')} ${ p?.currency ? "$" : "so'm" }` : "0", alignment: 'center' },
  //                       { text: p.scatter_num || "0", alignment: 'center' },
  //                       { text: p.scatter_price ? `${p.scatter_price.toLocaleString('ru-RU')} ${ p?.currency ? "$" : "so'm" }` : "0", alignment: 'center' },
  //                       { text: `${p.sum_price?.toLocaleString('ru-RU') || 0} so'm`, alignment: 'center' },
  //                       { text: p.car_cost ? `${p.car_cost.toLocaleString('ru-RU')} ${ p?.currency ? "$" : "so'm" }` : "0", alignment: 'center' },
  //                       { text: p.other_cost ? `${p.other_cost.toLocaleString('ru-RU')} ${ p?.currency ? "$" : "so'm" }` : "0", alignment: 'center' },
  //                       { text: `${p.total_price?.toLocaleString('ru-RU') || 0} so'm`, alignment: 'center' },
  //                       { text: p.driver || "-", alignment: 'center' },
  //                       { text: p.comment || "-", alignment: 'left' }
  //                   ])
  //               ]
  //           },
  //           layout: "lightHorizontalLines"
  //       },
  //       { text: "Kirimlar", style: "sectionHeader", margin: [0, 10, 0, 5] },
  //       {
  //           table: {
  //               headerRows: 1,
  //               widths: ['auto', 'auto', 'auto', 'auto', '*'],
  //               body: [
  //                   [
  //                       { text: "Sana", bold: true, alignment: 'center' },
  //                       { text: "To'lov summasi", bold: true, alignment: 'center' },
  //                       { text: "Valyuta kursi", bold: true, alignment: 'center' },
  //                       { text: "To'lov turi", bold: true, alignment: 'center' },
  //                       { text: "Izoh", bold: true, alignment: 'left' }
  //                   ],
  //                   ...incomes.map((i) => [
  //                       { text: i.date ? new Date(i.date).toLocaleDateString() : "Jami:", alignment: 'center' },
  //                       { text: i.currency ? `${new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(i.amount || 0)} $ | ${new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(i.currency * (i.amount || 0))} so'm` : (i.amount?.toLocaleString('ru-RU') || 0) + " so'm", alignment: 'center' },
  //                       { text: i.currency ? i.currency + " so'm" : "-", alignment: 'center' },
  //                       { text: i.method ? PAYMENT_METHODS[i.method] : '-', alignment: 'center' },
  //                       { text: i.comment || "-", alignment: 'left' }
  //                   ])
  //               ]
  //           },
  //           layout: "lightHorizontalLines"
  //       }
  //   ],
  //   styles: {
  //     header: { fontSize: 18, bold: true, margin: [0, 0, 0, 5] },
  //     subheader: { fontSize: 10, bold: true, margin: [0, 10, 0, 5] },
  //     sectionHeader: { fontSize: 14, bold: true, margin: [0, 20, 0, 5] },
  //   },
  // };



  // const docDefinition = {
  //   pageSize: 'A4', // Можно A3, A4, A5 и т. д.
  //   pageOrientation: 'landscape',
  //   content: [
  //     { text: `Mijoz: ${client.name}`, style: "header" },
  //     { text: `Telefon: ${client.phone || "Mavjud emas"}`, style: "header" },
  //     {
  //       text: [
  //         { text: "Balansi: ", style: "header", color: "black" },
  //         {
  //           text: (client.balance - (client.initial_debt || 0)).toLocaleString('ru-RU'),
  //           style: "header",
  //           color: (client.balance - (client.initial_debt || 0)) < 0
  //             ? "#f54a00"
  //             : (client.balance - (client.initial_debt || 0)) === 0
  //             ? "black"
  //             : "#008236"
  //         },
  //         { text: " so'm", style: "header", color: "black" }
  //       ],
  //     },
  //     {
  //       text: client.initial_debt ? `Avvalgi qolgan qarzi: ${client.initial_debt.toLocaleString('ru-RU')} so'm` : '', style: "subheader", color: "black"
  //     },
  //     { text: "Chiqimlar", style: "sectionHeader" },
  //     {
  //       table: {
  //         headerRows: 1,
  //         widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', '*'],
  //         body: [
  //           [
  //             { text: "Sanasi", bold: true, alignment: 'center', fillColor: '#f2f2f2' },
  //             { text: "Qop", bold: true, alignment: 'center', fillColor: '#f2f2f2' },
  //             { text: "Qop narxi", bold: true, alignment: 'center', fillColor: '#f2f2f2' },
  //             { text: "Sochma", bold: true, alignment: 'center', fillColor: '#f2f2f2' },
  //             { text: "Sochma narxi", bold: true, alignment: 'center', fillColor: '#f2f2f2' },
  //             { text: "Summasi", bold: true, alignment: 'center', fillColor: '#f2f2f2' },
  //             { text: "Mashina xarajati", bold: true, alignment: 'center', fillColor: '#f2f2f2' },
  //             { text: "Olgan naqd puli", bold: true, alignment: 'center', fillColor: '#f2f2f2' },
  //             { text: "Jami summasi", bold: true, alignment: 'center', fillColor: '#f2f2f2' },
  //             { text: "Haydovchi", bold: true, alignment: 'center', fillColor: '#f2f2f2' },
  //             { text: "Izoh", bold: true, alignment: 'left', fillColor: '#f2f2f2' }
  //           ],
  //           ...purchases.map((p) => [
  //             { text: p.date ? new Date(p.date).toLocaleDateString() : "Jami:", alignment: 'center' },
  //             { text: p.sack_num || "0", alignment: 'center' },
  //             { text: p.sack_price ? `${p.sack_price.toLocaleString('ru-RU')} ${p?.currency ? "$" : "so'm"}` : "0", alignment: 'center' },
  //             { text: p.scatter_num || "0", alignment: 'center' },
  //             { text: p.scatter_price ? `${p.scatter_price.toLocaleString('ru-RU')} ${p?.currency ? "$" : "so'm"}` : "0", alignment: 'center' },
  //             { text: `${p.sum_price?.toLocaleString('ru-RU') || 0} so'm`, alignment: 'center' },
  //             { text: p.car_cost ? `${p.car_cost.toLocaleString('ru-RU')} ${p?.currency ? "$" : "so'm"}` : "0", alignment: 'center' },
  //             { text: p.other_cost ? `${p.other_cost.toLocaleString('ru-RU')} ${p?.currency ? "$" : "so'm"}` : "0", alignment: 'center' },
  //             { text: `${p.total_price?.toLocaleString('ru-RU') || 0} so'm`, alignment: 'center' },
  //             { text: p.driver || "-", alignment: 'center' },
  //             { text: p.comment || "-", alignment: 'left' }
  //           ])
  //         ]
  //       },
  //       layout: {
  //         hLineWidth: function (i, node) {
  //           return (i === 0 || i === node.table.body.length) ? 1 : 0.5;
  //         },
  //         vLineWidth: function (i, node) {
  //           return (i === 0 || i === node.table.widths.length) ? 1 : 0.5;
  //         },
  //         hLineColor: function (i, node) {
  //           return (i === 0 || i === node.table.body.length) ? '#000' : '#aaa';
  //         },
  //         vLineColor: function (i, node) {
  //           return (i === 0 || i === node.table.widths.length) ? '#000' : '#aaa';
  //         },
  //       }
  //     },
  //     { text: "Kirimlar", style: "sectionHeader", margin: [0, 10, 0, 5] },
  //     {
  //       table: {
  //         headerRows: 1,
  //         widths: ['auto', 'auto', 'auto', 'auto', '*'],
  //         body: [
  //           [
  //             { text: "Sana", bold: true, alignment: 'center', fillColor: '#f2f2f2' },
  //             { text: "To'lov summasi", bold: true, alignment: 'center', fillColor: '#f2f2f2' },
  //             { text: "Valyuta kursi", bold: true, alignment: 'center', fillColor: '#f2f2f2' },
  //             { text: "To'lov turi", bold: true, alignment: 'center', fillColor: '#f2f2f2' },
  //             { text: "Izoh", bold: true, alignment: 'left', fillColor: '#f2f2f2' }
  //           ],
  //           ...incomes.map((i) => [
  //             { text: i.date ? new Date(i.date).toLocaleDateString() : "Jami:", alignment: 'center' },
  //             { text: i.currency ? `${new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(i.amount || 0)} $ | ${new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(i.currency * (i.amount || 0))} so'm` : (i.amount?.toLocaleString('ru-RU') || 0) + " so'm", alignment: 'center' },
  //             { text: i.currency ? `${i.currency} so'm` : "-", alignment: 'center' },
  //             { text: i.method ? PAYMENT_METHODS[i.method] : '-', alignment: 'center' },
  //             { text: i.comment || "-", alignment: 'left' }
  //           ])
  //         ]
  //       },
  //       layout: {
  //         hLineWidth: function (i, node) {
  //           return (i === 0 || i === node.table.body.length) ? 1 : 0.5;
  //         },
  //         vLineWidth: function (i, node) {
  //           return (i === 0 || i === node.table.widths.length) ? 1 : 0.5;
  //         },
  //         hLineColor: function (i, node) {
  //           return (i === 0 || i === node.table.body.length) ? '#000' : '#aaa';
  //         },
  //         vLineColor: function (i, node) {
  //           return (i === 0 || i === node.table.widths.length) ? '#000' : '#aaa';
  //         },
  //       }
  //     }
  //   ],
  //   styles: {
  //     header: { fontSize: 18, bold: true, margin: [0, 0, 0, 5] },
  //     subheader: { fontSize: 10, bold: true, margin: [0, 10, 0, 5] },
  //     sectionHeader: { fontSize: 14, bold: true, margin: [0, 20, 0, 5] },
  //   },
  // };
  
  purchases.pop()
  incomes.pop()
  const allEntries = [
    ...purchases.map(p => ({
      type: 'Chiqim',
      date: p.date,
      sack_num: p.sack_num || "0",
      sack_price: new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(p.sack_price || 0),
      scatter_num: p.scatter_num || "0",
      scatter_price: new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(p.scatter_price || 0),
      sum_price: new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(p.sum_price || 0),
      car_cost: new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(p.car_cost || 0),
      other_cost: new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(p.other_cost || 0),
      total_price: new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(p.total_price || 0),
      driver: p.driver || "-",
      comment: p.comment || "-",
      method: '',
      currency: p.currency,
      amount: null
    })),
    ...incomes.map(i => ({
      type: 'Kirim',
      date: i.date,
      sack_num: "-",
      sack_price: "-",
      scatter_num: "-",
      scatter_price: "-",
      sum_price: "-",
      car_cost: "-",
      other_cost: "-",
      total_price: i.currency ? `${(i.currency * i.amount).toLocaleString('ru-RU')}` : `${i.amount?.toLocaleString('ru-RU')}`,
      driver: '-',
      comment: i.comment || "-",
      method: i.method || '-',
      currency: i.currency,
      amount: i.amount || 0
    }))
  ];

  allEntries.sort((a, b) => (new Date(b.date) as any) - (new Date(a.date) as any));

  const docDefinition = {
    pageSize: 'A4', // Можно A3, A4, A5 и т. д.
    pageOrientation: 'landscape',
    content: [
      {
        table: {
          widths: ['20%', '30%', '20%', '30%'],
          body: [
            [
              { text: "Mijoz", bold: true, alignment: 'left', fillColor: '#003399', color: '#ffffff', style: 'tableText' },
              { text: "Telefon", bold: true, alignment: 'left', fillColor: '#003399', color: '#ffffff', style: 'tableText' },
              { text: "Balansi", bold: true, alignment: 'left', fillColor: '#003399', color: '#ffffff', style: 'tableText' },
              { text: "Avvalgi qolgan qarzi", bold: true, alignment: 'left', fillColor: '#003399', color: '#ffffff', style: 'tableText' }
            ],
            [
              { text: client.name, alignment: 'left', fillColor: '#f2f2f2', style: 'tableText' },
              { text: client.phone || "Mavjud emas", alignment: 'left', fillColor: '#f2f2f2', style: 'tableText' },
              {
                text: [
                  {
                    text: (client.balance - (client.initial_debt || 0)).toLocaleString('ru-RU'),
                    color: (client.balance - (client.initial_debt || 0)) < 0
                      ? "#f54a00"
                      : (client.balance - (client.initial_debt || 0)) === 0
                      ? "black"
                      : "#008236"
                  },
                  { text: " so'm", color: "black" }
                ],
                alignment: 'left',
                fillColor: '#f2f2f2',
                style: 'tableText'
              },
              { text: client.initial_debt ? `${client.initial_debt.toLocaleString('ru-RU')} so'm` : '-', alignment: 'left', fillColor: '#f2f2f2', style: 'tableText' }
            ]
          ]
        },
        layout: {
          hLineWidth: function (i, node) {
            return (i === 0 || i === node.table.body.length) ? 1 : 0.5;
          },
          vLineWidth: function (i, node) {
            return (i === 0 || i === node.table.widths.length) ? 1 : 0.5;
          },
          hLineColor: function (i, node) {
            return (i === 0 || i === node.table.body.length) ? '#000' : '#aaa';
          },
          vLineColor: function (i, node) {
            return (i === 0 || i === node.table.widths.length) ? '#000' : '#aaa';
          },
        }
      },

      {
        text: '', style: "subheader", color: "black"
      },

      {
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', '*'],
          body: [
            [
              { text: "Sana", style: 'tableText', bold: true, fillColor: '#003399', color: '#fff' },
              { text: "Turi", style: 'tableText', bold: true, fillColor: '#003399', color: '#fff' },
              { text: "Qop", style: 'tableText', bold: true, fillColor: '#003399', color: '#fff' },
              { text: "Qop narxi", style: 'tableText', bold: true, fillColor: '#003399', color: '#fff' },
              { text: "Sochma", style: 'tableText', bold: true, fillColor: '#003399', color: '#fff' },
              { text: "Sochma narxi", style: 'tableText', bold: true, fillColor: '#003399', color: '#fff' },
              { text: "Summasi", style: 'tableText', bold: true, fillColor: '#003399', color: '#fff' },
              { text: "Mashina xarajati", style: 'tableText', bold: true, fillColor: '#003399', color: '#fff' },
              { text: "Naqd pul / Valyuta", style: 'tableText', bold: true, fillColor: '#003399', color: '#fff' },
              { text: "Jami summa", style: 'tableText', bold: true, fillColor: '#003399', color: '#fff' },
              { text: "Haydovchi", style: 'tableText', bold: true, fillColor: '#003399', color: '#fff' },
              { text: "To'lov turi", style: 'tableText', bold: true, fillColor: '#003399', color: '#fff' },
              { text: "Izoh", style: 'tableText', bold: true, fillColor: '#003399', color: '#fff' }
            ],
            ...allEntries.map((entry, _) => {
              const bgColor = _ % 2 === 0 ? '#f2f2f2' : '#ffffff';
              // const bgColor = entry.type === 'Kirim' ? '#defceb' : '#fcdede';
              return [
                { text: entry.date ? new Intl.DateTimeFormat('ru-RU').format(new Date(entry.date)) : '-', style: 'tableText', alignment: 'center', fillColor: bgColor },
                { text: entry.type, style: 'tableText', alignment: 'center', fillColor: bgColor },
                { text: entry.sack_num?.toString(), style: 'tableText', alignment: 'center', fillColor: bgColor },
                { text: typeof entry.sack_price === 'number' ? `${entry.sack_price} ${entry.currency ? "$" : ""}` : entry.sack_price, style: 'tableText', alignment: 'center', fillColor: bgColor },
                { text: entry.scatter_num?.toString(), style: 'tableText', alignment: 'center', fillColor: bgColor },
                { text: typeof entry.scatter_price === 'number' ? `${entry.scatter_price} ${entry.currency ? "$" : ""}` : entry.scatter_price, style: 'tableText', alignment: 'center', fillColor: bgColor },
                { text: entry.sum_price, bold: true, style: 'tableText', alignment: 'center', fillColor: bgColor },
                { text: typeof entry.car_cost === 'number' ? `${entry.car_cost} ${entry.currency ? "$" : ""}` : entry.car_cost, style: 'tableText', alignment: 'center', fillColor: bgColor },
                { text: entry.currency && entry.amount ? `${entry.amount.toLocaleString('ru-RU')} $ (${entry.currency})` : (typeof entry.other_cost === 'number' ? `${entry.other_cost} ${entry.currency ? "$" : ""}` : entry.other_cost), style: 'tableText', alignment: 'center', fillColor: bgColor },
                { text: entry.total_price.toString(), bold: true, style: 'tableText', alignment: 'center', fillColor: bgColor },
                { text: entry.driver, style: 'tableText', alignment: 'center', fillColor: bgColor },
                { text: entry.method ? PAYMENT_METHODS[entry.method] : '-', style: 'tableText', alignment: 'center', fillColor: bgColor },
                { text: entry.comment, style: 'tableText', alignment: 'left', fillColor: bgColor }
              ];
            })
          ]
        },
        layout: {
          hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1 : 0.5,
          vLineWidth: (i, node) => (i === 0 || i === node.table.widths.length) ? 1 : 0.5,
          hLineColor: (i, node) => (i === 0 || i === node.table.body.length) ? '#000' : '#aaa',
          vLineColor: (i, node) => (i === 0 || i === node.table.widths.length) ? '#000' : '#aaa',
        }
      },
      
      // { text: "Chiqimlar", style: "sectionHeader" },
      // {
      //   table: {
      //     headerRows: 1,
      //     widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', '*'],
      //     body: [
      //       [
      //         { text: "Sanasi", bold: true, alignment: 'center', fillColor: '#003399', color: '#ffffff', style: 'tableText' },
      //         { text: "Qop", bold: true, alignment: 'center', fillColor: '#003399', color: '#ffffff', style: 'tableText' },
      //         { text: "Qop narxi", bold: true, alignment: 'center', fillColor: '#003399', color: '#ffffff', style: 'tableText' },
      //         { text: "Sochma", bold: true, alignment: 'center', fillColor: '#003399', color: '#ffffff', style: 'tableText' },
      //         { text: "Sochma narxi", bold: true, alignment: 'center', fillColor: '#003399', color: '#ffffff', style: 'tableText' },
      //         { text: "Summasi", bold: true, alignment: 'center', fillColor: '#003399', color: '#ffffff', style: 'tableText' },
      //         { text: "Mashina xarajati", bold: true, alignment: 'center', fillColor: '#003399', color: '#ffffff', style: 'tableText' },
      //         { text: "Olgan naqd puli", bold: true, alignment: 'center', fillColor: '#003399', color: '#ffffff', style: 'tableText' },
      //         { text: "Jami summasi", bold: true, alignment: 'center', fillColor: '#003399', color: '#ffffff', style: 'tableText' },
      //         { text: "Haydovchi", bold: true, alignment: 'center', fillColor: '#003399', color: '#ffffff', style: 'tableText' },
      //         { text: "Izoh", bold: true, alignment: 'left', fillColor: '#003399', color: '#ffffff', style: 'tableText' }
      //       ],
      //       ...purchases.map((p, index) => [
      //         { text: p.date ? new Intl.DateTimeFormat('ru-RU').format(new Date(p.date)) : "Jami:", alignment: 'center', fillColor: index % 2 === 0 ? '#e8ffe8' : '#e8ffe8', style: 'tableText' },
      //         { text: p.sack_num || "0", alignment: 'center', fillColor: index % 2 === 0 ? '#e8ffe8' : '#e8ffe8', style: 'tableText' },
      //         { text: p.sack_price ? `${p.sack_price.toLocaleString('ru-RU')} ${p?.currency ? "$" : ""}` : "0", alignment: 'center', fillColor: index % 2 === 0 ? '#e8ffe8' : '#e8ffe8', style: 'tableText' },
      //         { text: p.scatter_num || "0", alignment: 'center', fillColor: index % 2 === 0 ? '#e8ffe8' : '#e8ffe8', style: 'tableText' },
      //         { text: p.scatter_price ? `${p.scatter_price.toLocaleString('ru-RU')} ${p?.currency ? "$" : ""}` : "0", alignment: 'center', fillColor: index % 2 === 0 ? '#e8ffe8' : '#e8ffe8', style: 'tableText' },
      //         { text: `${p.sum_price?.toLocaleString('ru-RU') || 0}`, alignment: 'center', fillColor: index % 2 === 0 ? '#e8ffe8' : '#e8ffe8', style: 'tableText', bold: true },
      //         { text: p.car_cost ? `${p.car_cost.toLocaleString('ru-RU')} ${p?.currency ? "$" : ""}` : "0", alignment: 'center', fillColor: index % 2 === 0 ? '#e8ffe8' : '#e8ffe8', style: 'tableText' },
      //         { text: p.other_cost ? `${p.other_cost.toLocaleString('ru-RU')} ${p?.currency ? "$" : ""}` : "0", alignment: 'center', fillColor: index % 2 === 0 ? '#e8ffe8' : '#e8ffe8', style: 'tableText' },
      //         { text: `${p.total_price?.toLocaleString('ru-RU') || 0}`, alignment: 'center', fillColor: index % 2 === 0 ? '#e8ffe8' : '#e8ffe8', style: 'tableText', bold: true },
      //         { text: p.driver || "-", alignment: 'center', fillColor: index % 2 === 0 ? '#e8ffe8' : '#e8ffe8', style: 'tableText' },
      //         { text: p.comment || "-", alignment: 'left', fillColor: index % 2 === 0 ? '#e8ffe8' : '#e8ffe8', style: 'tableText' }
      //       ])
      //     ]
      //   },
      //   layout: {
      //     hLineWidth: function (i, node) {
      //       return (i === 0 || i === node.table.body.length) ? 1 : 0.5;
      //     },
      //     vLineWidth: function (i, node) {
      //       return (i === 0 || i === node.table.widths.length) ? 1 : 0.5;
      //     },
      //     hLineColor: function (i, node) {
      //       return (i === 0 || i === node.table.body.length) ? '#000' : '#aaa';
      //     },
      //     vLineColor: function (i, node) {
      //       return (i === 0 || i === node.table.widths.length) ? '#000' : '#aaa';
      //     },
      //   }
      // },
      // { text: "Kirimlar", style: "sectionHeader", margin: [0, 10, 0, 5] },
      // {
      //   table: {
      //     headerRows: 1,
      //     widths: ['auto', 'auto', 'auto', 100, '*'],
      //     body: [
      //       [
      //         { text: "Sana", bold: true, alignment: 'center', fillColor: '#003399', color: '#ffffff', style: 'tableText' },
      //         { text: "To'lov summasi", bold: true, alignment: 'center', fillColor: '#003399', color: '#ffffff', style: 'tableText' },
      //         { text: "Valyuta kursi", bold: true, alignment: 'center', fillColor: '#003399', color: '#ffffff', style: 'tableText' },
      //         { text: "To'lov turi", bold: true, alignment: 'center', fillColor: '#003399', color: '#ffffff', style: 'tableText' },
      //         { text: "Izoh", bold: true, alignment: 'left', fillColor: '#003399', color: '#ffffff', style: 'tableText' }
      //       ],
      //       ...incomes.map((i, index) => [
      //         { text: i.date ? new Intl.DateTimeFormat('ru-RU').format(new Date(i.date)) : "Jami:", alignment: 'center', fillColor: index % 2 === 0 ? '#e8ffe8' : '#e8ffe8', style: 'tableText' },
      //         { text: i.currency ? `${new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(i.amount || 0)} $ | ${new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(i.currency * (i.amount || 0))}` : (i.amount?.toLocaleString('ru-RU') || 0) + "", alignment: 'center', fillColor: index % 2 === 0 ? '#e8ffe8' : '#e8ffe8', style: 'tableText' },
      //         { text: i.currency ? `${i.currency}` : "-", alignment: 'center', fillColor: index % 2 === 0 ? '#e8ffe8' : '#e8ffe8', style: 'tableText' },
      //         { text: i.method ? PAYMENT_METHODS[i.method] : '-', alignment: 'center', fillColor: index % 2 === 0 ? '#e8ffe8' : '#e8ffe8', style: 'tableText' },
      //         { text: i.comment || "-", alignment: 'left', fillColor: index % 2 === 0 ? '#e8ffe8' : '#e8ffe8', style: 'tableText' }
      //       ])
      //     ]
      //   },
      //   layout: {
      //     hLineWidth: function (i, node) {
      //       return (i === 0 || i === node.table.body.length) ? 1 : 0.5;
      //     },
      //     vLineWidth: function (i, node) {
      //       return (i === 0 || i === node.table.widths.length) ? 1 : 0.5;
      //     },
      //     hLineColor: function (i, node) {
      //       return (i === 0 || i === node.table.body.length) ? '#000' : '#aaa';
      //     },
      //     vLineColor: function (i, node) {
      //       return (i === 0 || i === node.table.widths.length) ? '#000' : '#aaa';
      //     },
      //   }
      // }
    ],
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 5] },
      subheader: { fontSize: 10, bold: true, margin: [0, 10, 0, 5] },
      sectionHeader: { fontSize: 14, bold: true, margin: [0, 20, 0, 5] },
      tableText: { fontSize: 10 },
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