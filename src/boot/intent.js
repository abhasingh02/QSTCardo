export default () => {
  document.addEventListener('deviceready', () => {
    const intentShim = window.plugins?.intentShim
    if (!intentShim) {
      console.warn('IntentShim plugin not available.')
      return
    }

    // When app is launched from "Open with…"
    intentShim.getIntent(
      (intent) => {
        emitExcelIntent(intent)
      },
      (err) => {
        console.error('getIntent error:', err)
      },
    )

    // When app is already open and receives new file
    intentShim.onIntent(
      (intent) => {
        emitExcelIntent(intent)
      },
      (err) => {
        console.error('onIntent error:', err)
      },
    )
  })
}

function emitExcelIntent(intent) {
  if (!intent || !intent.data) return

  console.log('Received external file:', intent.data)

  window.dispatchEvent(
    new CustomEvent('external-excel-received', {
      detail: { fileUri: intent.data },
    }),
  )
}
