/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./worker/index.ts":
/*!*************************!*\
  !*** ./worker/index.ts ***!
  \*************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/// <reference lib=\"webworker\" />\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (null);\nself.addEventListener('push', (event)=>{\n    const notification = self.Notification;\n    if (!notification || notification.permission !== 'granted') {\n        return;\n    }\n    try {\n        var _event_data;\n        var _event_data_json;\n        const data = (_event_data_json = (_event_data = event.data) === null || _event_data === void 0 ? void 0 : _event_data.json()) !== null && _event_data_json !== void 0 ? _event_data_json : {};\n        const title = data.title || 'Nova Mensagem';\n        const options = {\n            body: data.body || 'Alguém interagiu com sua lista!',\n            icon: '/icons/icon-192x192.png',\n            badge: '/icons/icon-96x96.png',\n            vibrate: [\n                200,\n                100,\n                200,\n                100,\n                400\n            ],\n            data: {\n                url: data.url || '/'\n            },\n            tag: 'nudge-notification',\n            renotify: true // Vibra novamente se uma nova chegar com a mesma tag\n        };\n        event.waitUntil(self.registration.showNotification(title, options));\n    } catch (err) {\n        console.error('Erro ao processar push:', err);\n    }\n});\nself.addEventListener('notificationclick', (event)=>{\n    event.notification.close();\n    event.waitUntil(self.clients.matchAll({\n        type: 'window',\n        includeUncontrolled: true\n    }).then((clientList)=>{\n        if (clientList && clientList.length > 0) {\n            let client = clientList[0];\n            for(let i = 0; i < clientList.length; i++){\n                if (clientList[i].focused) {\n                    client = clientList[i];\n                }\n            }\n            return client.focus();\n        }\n        return self.clients.openWindow(event.notification.data.url);\n    }));\n});\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                /* unsupported import.meta.webpackHot */ undefined.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi93b3JrZXIvaW5kZXgudHMiLCJtYXBwaW5ncyI6Ijs7OztBQUFBLGlDQUFpQztBQUVqQyxpRUFBZSxJQUFJLEVBQUM7QUFHcEJBLEtBQUtDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQ0M7SUFDN0IsTUFBTUMsZUFBZSxLQUFjQyxZQUFZO0lBQy9DLElBQUksQ0FBQ0QsZ0JBQWdCQSxhQUFhRSxVQUFVLEtBQUssV0FBVztRQUMxRDtJQUNGO0lBRUEsSUFBSTtZQUNXSDtZQUFBQTtRQUFiLE1BQU1JLE9BQU9KLENBQUFBLG9CQUFBQSxjQUFBQSxNQUFNSSxJQUFJLGNBQVZKLGtDQUFBQSxZQUFZSyxJQUFJLGdCQUFoQkwsOEJBQUFBLG1CQUFzQixDQUFDO1FBQ3BDLE1BQU1NLFFBQVFGLEtBQUtFLEtBQUssSUFBSTtRQUM1QixNQUFNQyxVQUFlO1lBQ25CQyxNQUFNSixLQUFLSSxJQUFJLElBQUk7WUFDbkJDLE1BQU07WUFDTkMsT0FBTztZQUNQQyxTQUFTO2dCQUFDO2dCQUFLO2dCQUFLO2dCQUFLO2dCQUFLO2FBQUk7WUFDbENQLE1BQU07Z0JBQ0pRLEtBQUtSLEtBQUtRLEdBQUcsSUFBSTtZQUNuQjtZQUNBQyxLQUFLO1lBQ0xDLFVBQVUsS0FBSyxxREFBcUQ7UUFDdEU7UUFFQWQsTUFBTWUsU0FBUyxDQUFDakIsS0FBS2tCLFlBQVksQ0FBQ0MsZ0JBQWdCLENBQUNYLE9BQU9DO0lBQzVELEVBQUUsT0FBT1csS0FBSztRQUNaQyxRQUFRQyxLQUFLLENBQUMsMkJBQTJCRjtJQUMzQztBQUNGO0FBRUFwQixLQUFLQyxnQkFBZ0IsQ0FBQyxxQkFBcUIsQ0FBQ0M7SUFDMUNBLE1BQU1DLFlBQVksQ0FBQ29CLEtBQUs7SUFDeEJyQixNQUFNZSxTQUFTLENBQ2JqQixLQUFLd0IsT0FBTyxDQUFDQyxRQUFRLENBQUM7UUFBRUMsTUFBTTtRQUFVQyxxQkFBcUI7SUFBSyxHQUFHQyxJQUFJLENBQUMsQ0FBQ0M7UUFDekUsSUFBSUEsY0FBY0EsV0FBV0MsTUFBTSxHQUFHLEdBQUc7WUFDdkMsSUFBSUMsU0FBY0YsVUFBVSxDQUFDLEVBQUU7WUFDL0IsSUFBSyxJQUFJRyxJQUFJLEdBQUdBLElBQUlILFdBQVdDLE1BQU0sRUFBRUUsSUFBSztnQkFDMUMsSUFBSSxVQUFXLENBQUNBLEVBQUUsQ0FBU0MsT0FBTyxFQUFFO29CQUNsQ0YsU0FBU0YsVUFBVSxDQUFDRyxFQUFFO2dCQUN4QjtZQUNGO1lBQ0EsT0FBT0QsT0FBT0csS0FBSztRQUNyQjtRQUNBLE9BQU9sQyxLQUFLd0IsT0FBTyxDQUFDVyxVQUFVLENBQUNqQyxNQUFNQyxZQUFZLENBQUNHLElBQUksQ0FBQ1EsR0FBRztJQUM1RDtBQUVKIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXHBhdWxtXFxPbmVEcml2ZVxcQW1iaWVudGUgZGUgVHJhYmFsaG9cXFBST0pFVE9TXFxnYWdhLWxpc3RcXHdvcmtlclxcaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgbGliPVwid2Vid29ya2VyXCIgLz5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IG51bGw7XHJcbmRlY2xhcmUgdmFyIHNlbGY6IFNlcnZpY2VXb3JrZXJHbG9iYWxTY29wZTtcclxuXHJcbnNlbGYuYWRkRXZlbnRMaXN0ZW5lcigncHVzaCcsIChldmVudCkgPT4ge1xyXG4gIGNvbnN0IG5vdGlmaWNhdGlvbiA9IChzZWxmIGFzIGFueSkuTm90aWZpY2F0aW9uO1xyXG4gIGlmICghbm90aWZpY2F0aW9uIHx8IG5vdGlmaWNhdGlvbi5wZXJtaXNzaW9uICE9PSAnZ3JhbnRlZCcpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBkYXRhID0gZXZlbnQuZGF0YT8uanNvbigpID8/IHt9O1xyXG4gICAgY29uc3QgdGl0bGUgPSBkYXRhLnRpdGxlIHx8ICdOb3ZhIE1lbnNhZ2VtJztcclxuICAgIGNvbnN0IG9wdGlvbnM6IGFueSA9IHtcclxuICAgICAgYm9keTogZGF0YS5ib2R5IHx8ICdBbGd1w6ltIGludGVyYWdpdSBjb20gc3VhIGxpc3RhIScsXHJcbiAgICAgIGljb246ICcvaWNvbnMvaWNvbi0xOTJ4MTkyLnBuZycsXHJcbiAgICAgIGJhZGdlOiAnL2ljb25zL2ljb24tOTZ4OTYucG5nJyxcclxuICAgICAgdmlicmF0ZTogWzIwMCwgMTAwLCAyMDAsIDEwMCwgNDAwXSwgLy8gUGFkcsOjbyBtYWlzIGZvcnRlOiBjdXJ0bywgY3VydG8sIGxvbmdvXHJcbiAgICAgIGRhdGE6IHtcclxuICAgICAgICB1cmw6IGRhdGEudXJsIHx8ICcvJ1xyXG4gICAgICB9LFxyXG4gICAgICB0YWc6ICdudWRnZS1ub3RpZmljYXRpb24nLCAvLyBFdml0YSBlbXBpbGhhciB2w6FyaWFzIG5vdGlmaWNhw6fDtWVzIGlndWFpc1xyXG4gICAgICByZW5vdGlmeTogdHJ1ZSAvLyBWaWJyYSBub3ZhbWVudGUgc2UgdW1hIG5vdmEgY2hlZ2FyIGNvbSBhIG1lc21hIHRhZ1xyXG4gICAgfTtcclxuXHJcbiAgICBldmVudC53YWl0VW50aWwoc2VsZi5yZWdpc3RyYXRpb24uc2hvd05vdGlmaWNhdGlvbih0aXRsZSwgb3B0aW9ucykpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc29sZS5lcnJvcignRXJybyBhbyBwcm9jZXNzYXIgcHVzaDonLCBlcnIpO1xyXG4gIH1cclxufSk7XHJcblxyXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ25vdGlmaWNhdGlvbmNsaWNrJywgKGV2ZW50KSA9PiB7XHJcbiAgZXZlbnQubm90aWZpY2F0aW9uLmNsb3NlKCk7XHJcbiAgZXZlbnQud2FpdFVudGlsKFxyXG4gICAgc2VsZi5jbGllbnRzLm1hdGNoQWxsKHsgdHlwZTogJ3dpbmRvdycsIGluY2x1ZGVVbmNvbnRyb2xsZWQ6IHRydWUgfSkudGhlbigoY2xpZW50TGlzdCkgPT4ge1xyXG4gICAgICBpZiAoY2xpZW50TGlzdCAmJiBjbGllbnRMaXN0Lmxlbmd0aCA+IDApIHtcclxuICAgICAgICBsZXQgY2xpZW50OiBhbnkgPSBjbGllbnRMaXN0WzBdO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2xpZW50TGlzdC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgaWYgKChjbGllbnRMaXN0W2ldIGFzIGFueSkuZm9jdXNlZCkge1xyXG4gICAgICAgICAgICBjbGllbnQgPSBjbGllbnRMaXN0W2ldO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY2xpZW50LmZvY3VzKCk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHNlbGYuY2xpZW50cy5vcGVuV2luZG93KGV2ZW50Lm5vdGlmaWNhdGlvbi5kYXRhLnVybCk7XHJcbiAgICB9KVxyXG4gICk7XHJcbn0pO1xyXG4iXSwibmFtZXMiOlsic2VsZiIsImFkZEV2ZW50TGlzdGVuZXIiLCJldmVudCIsIm5vdGlmaWNhdGlvbiIsIk5vdGlmaWNhdGlvbiIsInBlcm1pc3Npb24iLCJkYXRhIiwianNvbiIsInRpdGxlIiwib3B0aW9ucyIsImJvZHkiLCJpY29uIiwiYmFkZ2UiLCJ2aWJyYXRlIiwidXJsIiwidGFnIiwicmVub3RpZnkiLCJ3YWl0VW50aWwiLCJyZWdpc3RyYXRpb24iLCJzaG93Tm90aWZpY2F0aW9uIiwiZXJyIiwiY29uc29sZSIsImVycm9yIiwiY2xvc2UiLCJjbGllbnRzIiwibWF0Y2hBbGwiLCJ0eXBlIiwiaW5jbHVkZVVuY29udHJvbGxlZCIsInRoZW4iLCJjbGllbnRMaXN0IiwibGVuZ3RoIiwiY2xpZW50IiwiaSIsImZvY3VzZWQiLCJmb2N1cyIsIm9wZW5XaW5kb3ciXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./worker/index.ts\n"));

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			if (cachedModule.error !== undefined) throw cachedModule.error;
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/trusted types policy */
/******/ 	(() => {
/******/ 		var policy;
/******/ 		__webpack_require__.tt = () => {
/******/ 			// Create Trusted Type policy if Trusted Types are available and the policy doesn't exist yet.
/******/ 			if (policy === undefined) {
/******/ 				policy = {
/******/ 					createScript: (script) => (script)
/******/ 				};
/******/ 				if (typeof trustedTypes !== "undefined" && trustedTypes.createPolicy) {
/******/ 					policy = trustedTypes.createPolicy("nextjs#bundler", policy);
/******/ 				}
/******/ 			}
/******/ 			return policy;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/trusted types script */
/******/ 	(() => {
/******/ 		__webpack_require__.ts = (script) => (__webpack_require__.tt().createScript(script));
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/react refresh */
/******/ 	(() => {
/******/ 		if (__webpack_require__.i) {
/******/ 		__webpack_require__.i.push((options) => {
/******/ 			const originalFactory = options.factory;
/******/ 			options.factory = (moduleObject, moduleExports, webpackRequire) => {
/******/ 				const hasRefresh = typeof self !== "undefined" && !!self.$RefreshInterceptModuleExecution$;
/******/ 				const cleanup = hasRefresh ? self.$RefreshInterceptModuleExecution$(moduleObject.id) : () => {};
/******/ 				try {
/******/ 					originalFactory.call(this, moduleObject, moduleExports, webpackRequire);
/******/ 				} finally {
/******/ 					cleanup();
/******/ 				}
/******/ 			}
/******/ 		})
/******/ 		}
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	
/******/ 	// noop fns to prevent runtime errors during initialization
/******/ 	if (typeof self !== "undefined") {
/******/ 		self.$RefreshReg$ = function () {};
/******/ 		self.$RefreshSig$ = function () {
/******/ 			return function (type) {
/******/ 				return type;
/******/ 			};
/******/ 		};
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval-source-map devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./worker/index.ts");
/******/ 	
/******/ })()
;