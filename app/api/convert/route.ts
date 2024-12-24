import { PDFDocument, rgb } from 'pdf-lib';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import xlsx from 'xlsx';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const targetFormat = formData.get('targetFormat') as string;
    
    if (!file || !targetFormat) {
      return new Response('Missing file or target format', { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const sourceFormat = file.name.split('.').pop()?.toLowerCase();

    let convertedBuffer: Buffer;

    switch (`${sourceFormat}-${targetFormat}`) {
      case 'svg-png':
        convertedBuffer = await sharp(buffer)
          .png()
          .toBuffer();
        break;

      case 'svg-jpg':
        convertedBuffer = await sharp(buffer)
          .jpeg()
          .toBuffer();
        break;

      case 'csv-xlsx':
        const workbook = xlsx.read(buffer);
        convertedBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
        break;

      // Add more conversion cases as needed

      default:
        return new Response('Unsupported conversion', { status: 400 });
    }

    return new Response(convertedBuffer, {
      headers: {
        'Content-Type': `application/${targetFormat}`,
        'Content-Disposition': `attachment; filename=converted.${targetFormat}`,
      },
    });
  } catch (error) {
    console.error('Conversion error:', error);
    return new Response('Conversion failed', { status: 500 });
  }
} 