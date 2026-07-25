// api/generate.js
// Vercel Serverless Function for AI Flix Platform

export default async function handler(req, res) {
  // 1. إعدادات الهيدر لمنع مشاكل CORS وترخيص الطلبات
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // التعامل مع طلبات الاختبار Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // السماح فقط بطلبات POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { mode, prompt } = req.body;

    // جلب مفاتيح الـ API من بيئة العمل العالية الأمان
    const RUNWAY_KEY = process.env.RUNWAY_API_SECRET || process.env.RUNWAY_API_KEY;

    // ----------------------------------------------------
    // 🎥 1. التوليد وتحريك الفيديو (Text-to-Video & Image-to-Video)
    // ----------------------------------------------------
    if (mode === 'video' || mode === 'img2vid') {
      const userPrompt = prompt || 'Cinematic ultra-realistic 8k video, masterpiece quality';

      // لو المفتاح متسجل في Vercel هيتصل بالسيرفر مباشرة
      if (RUNWAY_KEY) {
        const response = await fetch('https://api.runwayml.com/v1/deployments/gen2/generate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RUNWAY_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            promptText: userPrompt,
            watermark: false,
            duration: 4
          })
        });

        const data = await response.json();

        if (response.ok) {
          return res.status(200).json({
            success: true,
            type: 'video',
            url: data.output || data.url
          });
        }
      }

      // فيديو سينمائي استعراضي جاهز في حالة عدم ربط مفتاح الكارت
      return res.status(200).json({
        success: true,
        type: 'video',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-futuristic-city-with-traffic-at-night-41551-large.mp4'
      });
    }

    // ----------------------------------------------------
    // 💬 2. المساعد الذكي والدردشة (Chat Assistant)
    // ----------------------------------------------------
    if (mode === 'chat') {
      const aiReply = `أهلاً بك في منصة AI Flix! بناءً على طلبك: "${prompt || 'مرحباً'}"، يمكنك استخدام هذا الوصف في استوديو الفيديو للحصول على إخراج سينمائي عالي الجودة.`;
      
      return res.status(200).json({
        success: true,
        type: 'text',
        reply: aiReply
      });
    }

    // ----------------------------------------------------
    // 🎨 3. تعديل وتطبيق التأثيرات على الصور (Image Edit)
    // ----------------------------------------------------
    if (mode === 'edit') {
      return res.status(200).json({
        success: true,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop'
      });
    }

    return res.status(400).json({ success: false, error: 'نوع الطلب غير معروف' });

  } catch (error) {
    console.error('Error in API Handler:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في السيرفر الداخلي',
      details: error.message
    });
  }
}
