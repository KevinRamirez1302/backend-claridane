import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('❌ Error no controlado:', err);

  // Errores de validación de Zod
  if (err.name === 'ZodError') {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Datos de entrada inválidos', details: err },
    });
    return;
  }

  // Errores de Prisma conocidos
  if ('code' in err) {
    const prismaErr = err as { code: string; meta?: unknown };
    if (prismaErr.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE', message: 'Ya existe un registro con ese valor único' },
      });
      return;
    }
    if (prismaErr.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Registro no encontrado' },
      });
      return;
    }
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message:
        process.env.NODE_ENV === 'development'
          ? err.message
          : 'Error interno del servidor',
    },
  });
}
