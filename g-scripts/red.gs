/**
 * Default function name, that called after add-on installed from Google Workspace Marketplace
 */
function onInstall() { onOpen(); }

/**
 * Default function name, that called when the add-on menu inside Google Docs triggered
 */
function onOpen() {
  let ui = DocumentApp.getUi();
  ui.createAddonMenu().addItem('Open Application', 'openHomepage').addToUi();
}

function unknownError() {
  DocumentApp.getUi().alert('Terjadi kesalahan yang tidak diketahui.');
}

function permissionDenied() {
  DocumentApp.getUi().alert('Hubungi Administrator anda untuk mengakses aplikasi ini.');
}

/**
 * Used to insert graphic image on current cursor active
 */
function insertGraphic(image) {
  let cursor = DocumentApp.getActiveDocument().getCursor();
  const imageURL = 'https://staging-ebrpl-red.intelion.id/static/' + image;
  // const imageURL = 'https://0353-103-121-18-25.ap.ngrok.io/static/' + image;
  Logger.log(imageURL);
  if (cursor) {
    const blogImg = UrlFetchApp.fetch(imageURL).getBlob();
    cursor.insertInlineImage(blogImg);
    
    // calback to html ui
  } else {
    DocumentApp.getUi().alert('Kursor tidak ditemukan. Coba sisipkan ulang');
    throw new Error('Kursor tidak ditemukan. Coba sisipkan ulang')
  }
}

/**
 * Serve index.html as homepage after add-on menu clicked
 */
function openHomepage() {
  var html = HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Google Docs Add-On')
    .setWidth(500)
    .setFaviconUrl('https://i.ibb.co/fqSjmrv/96x96.png')
  DocumentApp.getUi().showSidebar(html);
}

function getSessionUserProperties() {  
  // try {  // set set global properties variable, because this google script is run as serverless function
  //   Logger.log(PropertiesService.getScriptProperties().getProperty('mykey'));
  // } catch (e) {}
  // PropertiesService.getScriptProperties().setProperty('mykey', session.random);
  
  return {
    email: Session.getActiveUser().getEmail(),
    tempKey: Session.getTemporaryActiveUserKey()
  }
}



