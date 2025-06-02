// export function convertToNestedObject(obj) {
//   const result = {};
//   Object.keys(obj).forEach((key) => {
//     const parts = key.split('.');
//     let currentPart = result;
//     parts.forEach((part, index) => {
//       if (index === parts.length - 1) {
//         currentPart[part] =
//           obj[key] === 'true' ? true : obj[key] === 'false' ? false : obj[key];
//       } else {
//         if (!currentPart[part]) currentPart[part] = {}; // Исправлено здесь
//         currentPart = currentPart[part];
//       }
//     });
//   });
//   return result;
// }
export function convertToNestedObject(obj) {
  const result = {};
  Object.keys(obj).forEach((key) => {
    const parts = key.split('.');
    let currentPart = result;
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        currentPart[part] =
          obj[key] === 'true' ? true : obj[key] === 'false' ? false : obj[key];
      } else {
        currentPart[part] = currentPart[part] || {};
        currentPart = currentPart[part];
      }
    });
  });
  return result;
}
