export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status }
}
export const failValidation = (res, parsed) =>
  res.status(400).json({ error: parsed.error.issues[0]?.message || 'Некорректные данные' })
