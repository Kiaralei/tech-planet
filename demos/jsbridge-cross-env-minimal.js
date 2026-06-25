const vm = require('node:vm')

// Host side: pretend this is Native / Unity / WebView host.
const jsRuntime = vm.createContext({
  console,
  setTimeout,
  NativeBridge: {
    postMessage(rawMessage) {
      const message = JSON.parse(rawMessage)
      console.log('[Host] received from JS:', message)

      setTimeout(() => {
        const response = {
          callbackId: message.callbackId,
          status: 'success',
          data: { text: 'result from host' },
        }

        console.log('[Host] send result back:', response)
        jsRuntime.JSBridge.receiveFromNative(JSON.stringify(response))
      }, 500)
    },
  },
})

// JS runtime side: pretend this code runs inside WebView / JSCore.
vm.runInContext(`
  const callbackMap = new Map()
  let id = 0

  globalThis.JSBridge = {
    invoke(api, params, callback) {
      const callbackId = 'cb_' + (++id)
      callbackMap.set(callbackId, callback)

      NativeBridge.postMessage(JSON.stringify({
        api,
        params,
        callbackId,
      }))
    },

    receiveFromNative(rawMessage) {
      const message = JSON.parse(rawMessage)
      const callback = callbackMap.get(message.callbackId)

      if (!callback) return
      callback(message.data)
      callbackMap.delete(message.callbackId)
    },
  }

  JSBridge.invoke('getSomething', { value: 1 }, (res) => {
    console.log('[JS] callback runs:', res)
  })

  console.log('[JS] invoke returned immediately')
`, jsRuntime)
