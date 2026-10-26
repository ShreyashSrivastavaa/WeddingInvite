import { Router, Request, Response } from 'express';
import {
  DEFAULT_TEMPLATES,
  templateUpdateSchema,
  updateWeddingSchema,
  weddingSchema,
} from '@rsvp/shared';
import { prisma } from '../db/prisma';
import { requireAuth } from '../middleware/auth';
import { requireOwnedWedding } from '../middleware/ownership';
import { validateBody } from '../middleware/validate';

const router = Router();
router.use(requireAuth);

// List all weddings for organizer
router.get('/', async (req: Request, res: Response) => {
  const weddings = await prisma.wedding.findMany({
    where: { ownerId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          events: true,
          households: true,
        },
      },
    },
  });

  res.json({ weddings });
});

// Create new wedding
router.post('/', validateBody(weddingSchema), async (req: Request, res: Response) => {
  const data = req.body;

  const wedding = await prisma.wedding.create({
    data: {
      ownerId: req.user!.id,
      title: data.title.trim(),
      partnerOneName: data.partnerOneName.trim(),
      partnerTwoName: data.partnerTwoName?.trim() || null,
      invitationMessage: data.invitationMessage?.trim() || null,
      rsvpDeadline: new Date(data.rsvpDeadline),
      timezone: data.timezone,
      dietaryOptions: data.dietaryOptions,
      theme: data.theme,
      coverImageUrl: data.coverImageUrl || null,
      cateringTarget: data.cateringTarget || null,
      allowChangesAfterDeadline: data.allowChangesAfterDeadline ?? true,
      templateInvitation: DEFAULT_TEMPLATES.INVITATION,
      templateGentleReminder: DEFAULT_TEMPLATES.GENTLE_REMINDER,
      templateFinalReminder: DEFAULT_TEMPLATES.FINAL_REMINDER,
    },
    include: {
      events: true,
      _count: {
        select: {
          events: true,
          households: true,
        },
      },
    },
  });

  res.status(201).json({ wedding });
});

// Get single wedding
router.get('/:weddingId', requireOwnedWedding, async (req: Request, res: Response) => {
  const wedding = await prisma.wedding.findUnique({
    where: { id: req.params.weddingId },
    include: {
      events: {
        orderBy: { startsAt: 'asc' },
      },
      _count: {
        select: {
          events: true,
          households: true,
        },
      },
    },
  });

  res.json({ wedding });
});

// Update wedding
router.patch(
  '/:weddingId',
  requireOwnedWedding,
  validateBody(updateWeddingSchema),
  async (req: Request, res: Response) => {
    const data = req.body;

    const updated = await prisma.wedding.update({
      where: { id: req.params.weddingId },
      data: {
        title: data.title !== undefined ? data.title.trim() : undefined,
        partnerOneName:
          data.partnerOneName !== undefined ? data.partnerOneName.trim() : undefined,
        partnerTwoName:
          data.partnerTwoName !== undefined ? data.partnerTwoName?.trim() || null : undefined,
        invitationMessage:
          data.invitationMessage !== undefined
            ? data.invitationMessage?.trim() || null
            : undefined,
        rsvpDeadline: data.rsvpDeadline ? new Date(data.rsvpDeadline) : undefined,
        timezone: data.timezone,
        dietaryOptions: data.dietaryOptions,
        theme: data.theme,
        coverImageUrl:
          data.coverImageUrl !== undefined ? data.coverImageUrl || null : undefined,
        cateringTarget:
          data.cateringTarget !== undefined ? data.cateringTarget || null : undefined,
        allowChangesAfterDeadline: data.allowChangesAfterDeadline,
      },
    });

    res.json({ wedding: updated });
  }
);

// Delete wedding (requires typed title confirmation from client)
router.delete('/:weddingId', requireOwnedWedding, async (req: Request, res: Response) => {
  const wedding = req.wedding!;
  const confirmTitle = req.query.confirmTitle;

  if (confirmTitle !== wedding.title) {
    res.status(400).json({
      error: {
        code: 'CONFIRMATION_MISMATCH',
        message: 'Please type the exact wedding title to confirm deletion.',
      },
    });
    return;
  }

  await prisma.wedding.delete({
    where: { id: wedding.id },
  });

  res.json({ success: true, message: 'Wedding deleted successfully' });
});

// Get wedding message templates
router.get('/:weddingId/templates', requireOwnedWedding, (req: Request, res: Response) => {
  const wedding = req.wedding!;
  res.json({
    templates: {
      invitation: wedding.templateInvitation || DEFAULT_TEMPLATES.INVITATION,
      gentleReminder: wedding.templateGentleReminder || DEFAULT_TEMPLATES.GENTLE_REMINDER,
      finalReminder: wedding.templateFinalReminder || DEFAULT_TEMPLATES.FINAL_REMINDER,
    },
  });
});

// Update wedding message templates
router.put(
  '/:weddingId/templates',
  requireOwnedWedding,
  validateBody(templateUpdateSchema),
  async (req: Request, res: Response) => {
    const { invitation, gentleReminder, finalReminder } = req.body;

    const updated = await prisma.wedding.update({
      where: { id: req.params.weddingId },
      data: {
        templateInvitation: invitation,
        templateGentleReminder: gentleReminder,
        templateFinalReminder: finalReminder,
      },
    });

    res.json({
      templates: {
        invitation: updated.templateInvitation,
        gentleReminder: updated.templateGentleReminder,
        finalReminder: updated.templateFinalReminder,
      },
    });
  }
);

export default router;
