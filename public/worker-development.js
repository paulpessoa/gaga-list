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

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/// <reference lib=\"webworker\" />\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (null);\nself.addEventListener('push', (event)=>{\n    const notification = self.Notification;\n    if (!notification || notification.permission !== 'granted') {\n        return;\n    }\n    try {\n        var _event_data;\n        var _event_data_json;\n        const data = (_event_data_json = (_event_data = event.data) === null || _event_data === void 0 ? void 0 : _event_data.json()) !== null && _event_data_json !== void 0 ? _event_data_json : {};\n        const title = data.title || 'Nova Mensagem';\n        const options = {\n            body: data.body || 'Alguém interagiu com sua lista!',\n            icon: '/icons/icon-192x192.png',\n            badge: '/icons/icon-96x96.png',\n            vibrate: [\n                100,\n                50,\n                100\n            ],\n            data: {\n                url: data.url || '/'\n            }\n        };\n        event.waitUntil(self.registration.showNotification(title, options));\n    } catch (err) {\n        console.error('Erro ao processar push:', err);\n    }\n});\nself.addEventListener('notificationclick', (event)=>{\n    event.notification.close();\n    event.waitUntil(self.clients.matchAll({\n        type: 'window',\n        includeUncontrolled: true\n    }).then((clientList)=>{\n        if (clientList && clientList.length > 0) {\n            let client = clientList[0];\n            for(let i = 0; i < clientList.length; i++){\n                if (clientList[i].focused) {\n                    client = clientList[i];\n                }\n            }\n            return client.focus();\n        }\n        return self.clients.openWindow(event.notification.data.url);\n    }));\n});\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                /* unsupported import.meta.webpackHot */ undefined.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi93b3JrZXIvaW5kZXgudHMiLCJtYXBwaW5ncyI6Ijs7OztBQUFBLGlDQUFpQztBQUVqQyxpRUFBZSxJQUFJLEVBQUM7QUFHcEJBLEtBQUtDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQ0M7SUFDN0IsTUFBTUMsZUFBZSxLQUFjQyxZQUFZO0lBQy9DLElBQUksQ0FBQ0QsZ0JBQWdCQSxhQUFhRSxVQUFVLEtBQUssV0FBVztRQUMxRDtJQUNGO0lBRUEsSUFBSTtZQUNXSDtZQUFBQTtRQUFiLE1BQU1JLE9BQU9KLENBQUFBLG9CQUFBQSxjQUFBQSxNQUFNSSxJQUFJLGNBQVZKLGtDQUFBQSxZQUFZSyxJQUFJLGdCQUFoQkwsOEJBQUFBLG1CQUFzQixDQUFDO1FBQ3BDLE1BQU1NLFFBQVFGLEtBQUtFLEtBQUssSUFBSTtRQUM1QixNQUFNQyxVQUFlO1lBQ25CQyxNQUFNSixLQUFLSSxJQUFJLElBQUk7WUFDbkJDLE1BQU07WUFDTkMsT0FBTztZQUNQQyxTQUFTO2dCQUFDO2dCQUFLO2dCQUFJO2FBQUk7WUFDdkJQLE1BQU07Z0JBQ0pRLEtBQUtSLEtBQUtRLEdBQUcsSUFBSTtZQUNuQjtRQUNGO1FBRUFaLE1BQU1hLFNBQVMsQ0FBQ2YsS0FBS2dCLFlBQVksQ0FBQ0MsZ0JBQWdCLENBQUNULE9BQU9DO0lBQzVELEVBQUUsT0FBT1MsS0FBSztRQUNaQyxRQUFRQyxLQUFLLENBQUMsMkJBQTJCRjtJQUMzQztBQUNGO0FBRUFsQixLQUFLQyxnQkFBZ0IsQ0FBQyxxQkFBcUIsQ0FBQ0M7SUFDMUNBLE1BQU1DLFlBQVksQ0FBQ2tCLEtBQUs7SUFDeEJuQixNQUFNYSxTQUFTLENBQ2JmLEtBQUtzQixPQUFPLENBQUNDLFFBQVEsQ0FBQztRQUFFQyxNQUFNO1FBQVVDLHFCQUFxQjtJQUFLLEdBQUdDLElBQUksQ0FBQyxDQUFDQztRQUN6RSxJQUFJQSxjQUFjQSxXQUFXQyxNQUFNLEdBQUcsR0FBRztZQUN2QyxJQUFJQyxTQUFjRixVQUFVLENBQUMsRUFBRTtZQUMvQixJQUFLLElBQUlHLElBQUksR0FBR0EsSUFBSUgsV0FBV0MsTUFBTSxFQUFFRSxJQUFLO2dCQUMxQyxJQUFJLFVBQVcsQ0FBQ0EsRUFBRSxDQUFTQyxPQUFPLEVBQUU7b0JBQ2xDRixTQUFTRixVQUFVLENBQUNHLEVBQUU7Z0JBQ3hCO1lBQ0Y7WUFDQSxPQUFPRCxPQUFPRyxLQUFLO1FBQ3JCO1FBQ0EsT0FBT2hDLEtBQUtzQixPQUFPLENBQUNXLFVBQVUsQ0FBQy9CLE1BQU1DLFlBQVksQ0FBQ0csSUFBSSxDQUFDUSxHQUFHO0lBQzVEO0FBRUoiLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xccGF1bG1cXE9uZURyaXZlXFxBbWJpZW50ZSBkZSBUcmFiYWxob1xcUFJPSkVUT1NcXGdhZ2EtbGlzdFxcd29ya2VyXFxpbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gPHJlZmVyZW5jZSBsaWI9XCJ3ZWJ3b3JrZXJcIiAvPlxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbnVsbDtcclxuZGVjbGFyZSB2YXIgc2VsZjogU2VydmljZVdvcmtlckdsb2JhbFNjb3BlO1xyXG5cclxuc2VsZi5hZGRFdmVudExpc3RlbmVyKCdwdXNoJywgKGV2ZW50KSA9PiB7XHJcbiAgY29uc3Qgbm90aWZpY2F0aW9uID0gKHNlbGYgYXMgYW55KS5Ob3RpZmljYXRpb247XHJcbiAgaWYgKCFub3RpZmljYXRpb24gfHwgbm90aWZpY2F0aW9uLnBlcm1pc3Npb24gIT09ICdncmFudGVkJykge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGRhdGEgPSBldmVudC5kYXRhPy5qc29uKCkgPz8ge307XHJcbiAgICBjb25zdCB0aXRsZSA9IGRhdGEudGl0bGUgfHwgJ05vdmEgTWVuc2FnZW0nO1xyXG4gICAgY29uc3Qgb3B0aW9uczogYW55ID0ge1xyXG4gICAgICBib2R5OiBkYXRhLmJvZHkgfHwgJ0FsZ3XDqW0gaW50ZXJhZ2l1IGNvbSBzdWEgbGlzdGEhJyxcclxuICAgICAgaWNvbjogJy9pY29ucy9pY29uLTE5MngxOTIucG5nJyxcclxuICAgICAgYmFkZ2U6ICcvaWNvbnMvaWNvbi05Nng5Ni5wbmcnLFxyXG4gICAgICB2aWJyYXRlOiBbMTAwLCA1MCwgMTAwXSxcclxuICAgICAgZGF0YToge1xyXG4gICAgICAgIHVybDogZGF0YS51cmwgfHwgJy8nXHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgZXZlbnQud2FpdFVudGlsKHNlbGYucmVnaXN0cmF0aW9uLnNob3dOb3RpZmljYXRpb24odGl0bGUsIG9wdGlvbnMpKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm8gYW8gcHJvY2Vzc2FyIHB1c2g6JywgZXJyKTtcclxuICB9XHJcbn0pO1xyXG5cclxuc2VsZi5hZGRFdmVudExpc3RlbmVyKCdub3RpZmljYXRpb25jbGljaycsIChldmVudCkgPT4ge1xyXG4gIGV2ZW50Lm5vdGlmaWNhdGlvbi5jbG9zZSgpO1xyXG4gIGV2ZW50LndhaXRVbnRpbChcclxuICAgIHNlbGYuY2xpZW50cy5tYXRjaEFsbCh7IHR5cGU6ICd3aW5kb3cnLCBpbmNsdWRlVW5jb250cm9sbGVkOiB0cnVlIH0pLnRoZW4oKGNsaWVudExpc3QpID0+IHtcclxuICAgICAgaWYgKGNsaWVudExpc3QgJiYgY2xpZW50TGlzdC5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgbGV0IGNsaWVudDogYW55ID0gY2xpZW50TGlzdFswXTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNsaWVudExpc3QubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgIGlmICgoY2xpZW50TGlzdFtpXSBhcyBhbnkpLmZvY3VzZWQpIHtcclxuICAgICAgICAgICAgY2xpZW50ID0gY2xpZW50TGlzdFtpXTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGNsaWVudC5mb2N1cygpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBzZWxmLmNsaWVudHMub3BlbldpbmRvdyhldmVudC5ub3RpZmljYXRpb24uZGF0YS51cmwpO1xyXG4gICAgfSlcclxuICApO1xyXG59KTtcclxuIl0sIm5hbWVzIjpbInNlbGYiLCJhZGRFdmVudExpc3RlbmVyIiwiZXZlbnQiLCJub3RpZmljYXRpb24iLCJOb3RpZmljYXRpb24iLCJwZXJtaXNzaW9uIiwiZGF0YSIsImpzb24iLCJ0aXRsZSIsIm9wdGlvbnMiLCJib2R5IiwiaWNvbiIsImJhZGdlIiwidmlicmF0ZSIsInVybCIsIndhaXRVbnRpbCIsInJlZ2lzdHJhdGlvbiIsInNob3dOb3RpZmljYXRpb24iLCJlcnIiLCJjb25zb2xlIiwiZXJyb3IiLCJjbG9zZSIsImNsaWVudHMiLCJtYXRjaEFsbCIsInR5cGUiLCJpbmNsdWRlVW5jb250cm9sbGVkIiwidGhlbiIsImNsaWVudExpc3QiLCJsZW5ndGgiLCJjbGllbnQiLCJpIiwiZm9jdXNlZCIsImZvY3VzIiwib3BlbldpbmRvdyJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./worker/index.ts\n"));

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