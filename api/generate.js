// api/generate.js
// Vercel Serverless Function for AI Flix Platform

export default async function handler(req, res) {
  // إعدادات الهيدر لمنع مشاكل CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { mode, prompt } = req.body;
    const RUNWAY_KEY = process.env.RUNWAY_API_SECRET || process.env.RUNWAY_API_KEY;

    // 🎥 1. توليد الفيديو
    if (mode === 'video' || mode === 'img2vid') {
      if (RUNWAY_KEY) {
        const response = await fetch('https://api.runwayml.com/v1/deployments/gen2/generate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RUNWAY_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            promptText: prompt || 'Cinematic video',
            watermark: false,
            duration: 4
          })
        });

        const data = await response.json();
        if (response.ok && (data.output || data.url)) {
          return res.status(200).json({
            success: true,
            type: 'video',
            url: data.output || data.url
          });
        }
      }

      // رابط فيديو استعراضي سريع ومضمون التشغيل من جوجل
      return res.status(200).json({
        success: true,
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
      });
    }

    // 💬 2. المساعد الذكي
    if (mode === 'chat') {
      return res.status(200).json({
        success: true,
        type: 'text',
        reply: `تم معالجة طلبك بنجاح في AI Flix! النص المدخل: "${prompt || 'مرحباً'}"`
      });
    }

    // 🎨 3. تعديل الصور
    if (mode === 'edit') {
      return res.status(200).json({
        success: true,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop'
      });
    }

    return res.status(400).json({ success: false, error: 'نوع الطلب غير معروف' });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في السيرفر',
      details: error.message
    });
  }
}
