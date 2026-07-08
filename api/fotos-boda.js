export default async function handler(req, res) {
  const CLOUD_NAME = "mwbuyheu";
  const API_KEY = process.env.CLOUDINARY_API_KEY;
  const API_SECRET = process.env.CLOUDINARY_API_SECRET;

  if (!API_KEY || !API_SECRET) {
    return res.status(500).json({
      ok: false,
      error: "Faltan las variables CLOUDINARY_API_KEY o CLOUDINARY_API_SECRET en Vercel."
    });
  }

  const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64");

  const cloudinaryUrl =
  `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image/upload` +
  `?max_results=100&direction=desc`;

  try {
    const response = await fetch(cloudinaryUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error: "Cloudinary ha devuelto un error.",
        details: data
      });
    }

    const fotos = (data.resources || []).map((foto) => ({
      public_id: foto.public_id,
      url: foto.secure_url,
      created_at: foto.created_at,
      width: foto.width,
      height: foto.height
    }));

    return res.status(200).json({
      ok: true,
      total: fotos.length,
      fotos
    });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Error interno al cargar las fotos de Cloudinary.",
      details: error.message
    });
  }
}
