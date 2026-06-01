const vm = require('node:vm')

const context = vm.createContext({
  console,
  setTimeout,
})

const callbacks = new Map()
let callbackId = 0

function nativeReceiveMessage(message) {
  console.log('[Native] 收到 JS 消息:', message)

  if (message.api === 'scanCode') {
    setTimeout(() => {
      const result = {
        callbackId: message.callbackId,
        status: 'success',
        data: {
          result: 'https://example.com/from-qrcode',
        },
      }

      console.log('[Native] 扫码完成，回传结果:', result)
      context.WeixinJSBridge._handleMessageFromNative(result)
    }, 800)
  }
}

context.WeixinJSBridge = {
  invoke(api, params, callbackId) {
    nativeReceiveMessage({
      api,
      params,
      callbackId,
    })
  },

  _handleMessageFromNative(message) {
    const handler = callbacks.get(message.callbackId)

    if (!handler) return

    if (message.status === 'success') {
      handler.success?.(message.data)
    } else {
      handler.fail?.(message.error)
    }

    handler.complete?.(message.data || message.error)
    callbacks.delete(message.callbackId)
  },
}

context.wx = {
  scanCode(options) {
    const id = `callback_${++callbackId}`

    callbacks.set(id, {
      success: options.success,
      fail: options.fail,
      complete: options.complete,
    })

    context.WeixinJSBridge.invoke('scanCode', {
      onlyFromCamera: options.onlyFromCamera,
    }, id)
  },
}

const appCode = `
  wx.scanCode({
    onlyFromCamera: true,
    success(res) {
      console.log('[JS] success 回调:', res)
    },
    fail(err) {
      console.log('[JS] fail 回调:', err)
    },
    complete(res) {
      console.log('[JS] complete 回调:', res)
    },
  })
`

vm.runInContext(appCode, context)
