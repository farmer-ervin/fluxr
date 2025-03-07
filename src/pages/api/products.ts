import { stripHtml } from '@/lib/utils';

// In your API route handler where you save the product:
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { productDescription, ...otherData } = req.body;
    
    // Sanitize the description before saving
    const sanitizedDescription = stripHtml(productDescription);
    
    // Save to database with sanitized description
    const result = await supabase
      .from('products')
      .insert([{ 
        ...otherData,
        productDescription: sanitizedDescription 
      }]);

    res.status(200).json(result);
  }
} 