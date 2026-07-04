"""
Seed the database with demo data. Runs automatically on container start.
Skipped if seed data already exists.

Demo accounts created:
  Seniors:    senior1@demo.com / senior2@demo.com   password: Demo1234!
  Volunteer:  volunteer@demo.com                     password: Demo1234!
"""
import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy import select

from app.services.database import AsyncSessionLocal
from app.models.user import User, UserRole
from app.models.help_request import HelpRequest, RequestCategory, RequestStatus
from app.models.assignment import VolunteerAssignment
from app.services.auth_service import hash_password

SEED_EMAIL = "senior1@demo.com"
DEMO_PASSWORD = "Demo1234!"
NOW = datetime.now(timezone.utc)


async def seed():
    async with AsyncSessionLocal() as db:
        exists = (await db.execute(
            select(User).where(User.email == SEED_EMAIL)
        )).scalar_one_or_none()
        if exists:
            print("[seed] Already seeded — skipping.")
            return

        print("[seed] Seeding demo data...")

        senior1 = User(name="Marie Dupont",   email="senior1@demo.com",   password_hash=hash_password(DEMO_PASSWORD), role=UserRole.REQUESTER)
        senior2 = User(name="Jean Bernard",   email="senior2@demo.com",   password_hash=hash_password(DEMO_PASSWORD), role=UserRole.REQUESTER)
        volunteer = User(name="Camille Martin", email="volunteer@demo.com", password_hash=hash_password(DEMO_PASSWORD), role=UserRole.VOLUNTEER)
        db.add_all([senior1, senior2, volunteer])
        await db.flush()

        pending_requests = [
            HelpRequest(
                requester_id=senior1.id,
                title="Courses au supermarché",
                description="J'ai besoin d'aide pour faire mes courses hebdomadaires. Je ne peux pas porter les sacs seule à cause de mon dos.",
                category=RequestCategory.GROCERY,
                scheduled_at=NOW + timedelta(hours=4),
                location_text="Carrefour, 14 rue de Rivoli, Paris 1er",
                status=RequestStatus.PENDING,
            ),
            HelpRequest(
                requester_id=senior1.id,
                title="Accompagnement chez le médecin",
                description="Rendez-vous chez mon cardiologue. J'aurais besoin de quelqu'un pour m'accompagner et m'aider avec les transports.",
                category=RequestCategory.MEDICAL,
                scheduled_at=NOW + timedelta(days=2, hours=9),
                location_text="Cabinet Dr. Lefebvre, 8 avenue de l'Opéra, Paris 1er",
                status=RequestStatus.PENDING,
            ),
            HelpRequest(
                requester_id=senior2.id,
                title="Aide pour configurer mon téléphone",
                description="Mon nouveau smartphone est arrivé mais je n'arrive pas à transférer mes contacts et photos depuis l'ancien.",
                category=RequestCategory.OTHER,
                scheduled_at=NOW + timedelta(days=1, hours=14),
                location_text="12 rue Saint-Antoine, Paris 4ème",
                status=RequestStatus.PENDING,
            ),
            HelpRequest(
                requester_id=senior2.id,
                title="Nettoyage de l'appartement",
                description="Suite à une convalescence, j'ai besoin d'aide pour faire un grand ménage de mon appartement (salon, cuisine, salle de bain).",
                category=RequestCategory.CLEANING,
                scheduled_at=NOW + timedelta(days=3, hours=10),
                location_text="45 boulevard Voltaire, Paris 11ème",
                status=RequestStatus.PENDING,
            ),
            HelpRequest(
                requester_id=senior1.id,
                title="Transport à la pharmacie",
                description="Je dois récupérer des médicaments urgents à la pharmacie mais je n'ai pas de voiture. Trajet aller-retour d'environ 20 minutes.",
                category=RequestCategory.TRANSPORT,
                scheduled_at=NOW + timedelta(hours=2),
                location_text="Pharmacie Centrale, 22 rue de la Paix, Paris 2ème",
                status=RequestStatus.PENDING,
            ),
        ]
        db.add_all(pending_requests)
        await db.flush()

        completed1 = HelpRequest(
            requester_id=senior1.id,
            title="Aide pour remplir un formulaire CAF",
            description="Besoin d'aide pour compléter ma demande d'allocation en ligne.",
            category=RequestCategory.OTHER,
            scheduled_at=NOW - timedelta(days=5),
            location_text="15 rue du Temple, Paris 3ème",
            status=RequestStatus.COMPLETED,
        )
        completed2 = HelpRequest(
            requester_id=senior2.id,
            title="Courses et petits achats",
            description="Courses de la semaine : pain, légumes, produits d'hygiène.",
            category=RequestCategory.GROCERY,
            scheduled_at=NOW - timedelta(days=10),
            location_text="Monoprix, 71 rue Saint-Antoine, Paris 4ème",
            status=RequestStatus.COMPLETED,
        )
        completed3 = HelpRequest(
            requester_id=senior1.id,
            title="Consultation chez l'opticien",
            description="Accompagnement pour le choix de nouvelles lunettes et récupérer l'ordonnance.",
            category=RequestCategory.MEDICAL,
            scheduled_at=NOW - timedelta(days=18),
            location_text="Opticien Krys, 32 avenue de la République, Paris 11ème",
            status=RequestStatus.COMPLETED,
        )
        db.add_all([completed1, completed2, completed3])
        await db.flush()

        db.add_all([
            VolunteerAssignment(
                request_id=completed1.id,
                volunteer_id=volunteer.id,
                accepted_at=NOW - timedelta(days=5, hours=1),
                completed_at=NOW - timedelta(days=5),
                eta_minutes=15,
            ),
            VolunteerAssignment(
                request_id=completed2.id,
                volunteer_id=volunteer.id,
                accepted_at=NOW - timedelta(days=10, hours=2),
                completed_at=NOW - timedelta(days=10),
                eta_minutes=20,
            ),
            VolunteerAssignment(
                request_id=completed3.id,
                volunteer_id=volunteer.id,
                accepted_at=NOW - timedelta(days=18, hours=1),
                completed_at=NOW - timedelta(days=18),
                eta_minutes=10,
            ),
        ])

        await db.commit()
        print("[seed] Done. Demo accounts: senior1@demo.com, senior2@demo.com, volunteer@demo.com (password: Demo1234!)")


if __name__ == "__main__":
    asyncio.run(seed())
