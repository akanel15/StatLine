import XLSX from "xlsx";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

export const exportToExcel = async () => {
  let data = [
    { name: "John", city: "Seattle" },
    { name: "Mike", city: "Los Angeles" },
    { name: "Zach", city: "New York" },
  ];

  let ws = XLSX.utils.json_to_sheet(data);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Cities");

  const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
  const uri = FileSystem.cacheDirectory + "cities.xlsx";

  await FileSystem.writeAsStringAsync(uri, wbout, {
    encoding: FileSystem.EncodingType.Base64,
  });

  await Sharing.shareAsync(uri, {
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    dialogTitle: "MyWater data",
    UTI: "com.microsoft.excel.xlsx",
  });
};
