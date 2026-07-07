function doPost(e) {
  try {
    const dados    = JSON.parse(e.postData.contents);
    const planilha = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    if (planilha.getLastRow() === 0) {
      planilha.appendRow(["Data e Hora", "Nome", "E-mail", "Telefone", "Foi indicado?", "Quem indicou"]);
      const h = planilha.getRange(1, 1, 1, 6);
      h.setFontWeight("bold");
      h.setBackground("#C9A227");
      h.setFontColor("#0D1B3E");
      planilha.setColumnWidth(1, 160);
      planilha.setColumnWidth(2, 220);
      planilha.setColumnWidth(3, 250);
      planilha.setColumnWidth(4, 180);
      planilha.setColumnWidth(5, 130);
      planilha.setColumnWidth(6, 220);
    }

    const agora = Utilities.formatDate(new Date(), "America/Recife", "dd/MM/yyyy HH:mm:ss");

    planilha.appendRow([
      agora,
      dados.nome      || "",
      dados.email     || "",
      dados.telefone  || "",
      dados.indicado  || "",
      dados.indicador || "",
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "erro", mensagem: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput("CPPEM Sheets — funcionando.");
}
