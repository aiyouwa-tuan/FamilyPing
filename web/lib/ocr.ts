import Tesseract from 'tesseract.js'

export interface OCRState {
  isLoading: boolean
  progress: number
  error: string | null
}

let worker: Tesseract.Worker | null = null
let workerInitializing = false

/**
 * Initialize the Tesseract worker (lazy, singleton).
 */
async function getWorker(): Promise<Tesseract.Worker> {
  if (worker) return worker

  if (workerInitializing) {
    // Wait for the existing initialization to complete
    while (workerInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    if (worker) return worker
  }

  workerInitializing = true

  try {
    const w = await Tesseract.createWorker('eng', undefined, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          currentProgress = Math.round((m.progress || 0) * 100)
        }
      },
    })
    worker = w
    return w
  } finally {
    workerInitializing = false
  }
}

let currentProgress = 0

/**
 * Get current OCR progress (0-100).
 */
export function getOCRProgress(): number {
  return currentProgress
}

/**
 * Recognize text from an image data URL.
 * Uses Tesseract.js for client-side OCR.
 */
export async function recognizeText(imageDataUrl: string): Promise<string> {
  if (!imageDataUrl) {
    throw new Error('No image data provided for OCR')
  }

  currentProgress = 0

  try {
    const w = await getWorker()
    const result = await w.recognize(imageDataUrl)
    currentProgress = 100

    const text = result.data.text.trim()

    if (!text) {
      throw new Error('No text could be recognized from the image')
    }

    return text
  } catch (error) {
    currentProgress = 0

    if (error instanceof Error) {
      throw new Error(`OCR failed: ${error.message}`)
    }
    throw new Error('OCR failed: Unknown error')
  }
}

/**
 * Terminate the Tesseract worker to free memory.
 * Call this when OCR is no longer needed.
 */
export async function terminateOCR(): Promise<void> {
  if (worker) {
    await worker.terminate()
    worker = null
    currentProgress = 0
  }
}
