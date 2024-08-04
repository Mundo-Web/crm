File.toBase64 = function (blob) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onloadend = () => {
            resolve(reader.result);
        }
        reader.onerror = () => {
            reject(new Error('No se pudo convertir el archivo en base64'));
        }
        reader.readAsDataURL(blob);
    });
}

File.toURL = blob => {
    return URL.createObjectURL(blob)
}

File.fromURL = async (url, options) => {
    try {
        const res = await fetch(url, options)
        const blob = await res.blob()
        const file = new File([blob], crypto.randomUUID(), {
            type: blob.type,
        })
        return file
    } catch (error) {
        return null
    }
}

File.compress = async function (blob, {
    full_length = 1e3,
    mini_length = 1e2,
    square = true
} = {
        full_length: 1e3,
        mini_length: 1e2,
        square: true
    }) {
    if (!blob.type.startsWith('image/'))
        throw new Error('Solo imagenes se pueden comprimir')
    let ok = true;
    let image_type = blob.type;
    let image_full = null;
    let image_mini = null;
    let image_real = null;

    try {
        let src = await File.toBase64(blob);
        let image = new Image();
        image.src = src;
        await image.onload;

        let xcrop = 0;
        let ycrop = 0;
        let original_width = image.width;
        let original_height = image.height;
        let original_length = Math.min(original_width, original_height);

        if (square) {
            xcrop = (original_width - original_length) / 2;
            ycrop = (original_height - original_length) / 2;
            original_width = original_length;
            original_height = original_length;
        }

        let canvas_full = document.createElement('canvas');
        canvas_full.width = full_length;
        canvas_full.height = full_length;
        canvas_full.style.objectFit = 'cover';
        canvas_full.style.objectPosition = 'center center';

        let ctx_full = canvas_full.getContext('2d');
        ctx_full.drawImage(
            image,
            xcrop, ycrop,
            original_width, original_height,
            0, 0,
            full_length, full_length
        );

        image_full = canvas_full.toDataURL(image_type).split(',')[1];

        let canvas_mini = document.createElement('canvas');
        canvas_mini.width = mini_length;
        canvas_mini.height = mini_length;

        let ctx_mini = canvas_mini.getContext('2d');
        ctx_mini.drawImage(
            image,
            xcrop, ycrop,
            original_width, original_height,
            0, 0,
            mini_length, mini_length
        );

        image_mini = canvas_mini.toDataURL(image_type).split(',')[1];

        image_real = src.split(',')[1];
    } catch (error) {
        console.error(error);
        alert(error);
        ok = false;
    } finally {
        return {
            ok,
            type: image_type,
            filename: blob.name || crypto.randomUUID(),
            full: image_full.length > image_real.length ? image_real : image_full,
            thumbnail: image_mini,
            original: image_real
        };
    }
}