/**
 * Сжимает изображение до указанного максимального размера
 * @param {File} file - Файл изображения
 * @param {number} maxWidth - Максимальная ширина (по умолчанию 1920)
 * @param {number} maxHeight - Максимальная высота (по умолчанию 1920)
 * @param {number} quality - Качество JPEG (0-1, по умолчанию 0.8)
 * @returns {Promise<string>} Data URL сжатого изображения
 */
export const compressImage = (file, maxWidth = 1920, maxHeight = 1920, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Вычисляем новые размеры с сохранением пропорций
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Определяем формат вывода
        let mimeType = file.type;
        
        // SVG не сжимаем, возвращаем как есть
        if (file.type === 'image/svg+xml') {
          reader.readAsText(file);
          reader.onload = () => resolve(reader.result);
          return;
        }
        
        // Для PNG с прозрачностью сохраняем PNG, иначе конвертируем в JPEG
        if (file.type === 'image/png') {
          // Проверяем наличие прозрачности
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          let hasTransparency = false;
          
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] < 255) {
              hasTransparency = true;
              break;
            }
          }
          
          if (!hasTransparency) {
            mimeType = 'image/jpeg';
          }
        } else if (file.type === 'image/gif' || file.type === 'image/webp') {
          // GIF и WebP конвертируем в JPEG для лучшего сжатия
          mimeType = 'image/jpeg';
        }
        
        // Конвертируем в Data URL
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      };
      
      img.onerror = () => reject(new Error('Не удалось загрузить изображение'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.readAsDataURL(file);
  });
};
