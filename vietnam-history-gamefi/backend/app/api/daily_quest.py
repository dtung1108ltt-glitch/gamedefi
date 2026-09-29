import datetime
from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import require_session, require_wallet
from app.core.security import SessionPrincipal
from app.core.store import store, DAILY_QUEST_DEFINITIONS
from app.schemas import DailyQuestOut, DailyQuestSummaryOut

router = APIRouter(prefix="/daily-quests", tags=["daily_quest"])


@router.get("/players/{wallet}", response_model=DailyQuestSummaryOut)
def get_daily_quests(
    wallet: str,
    principal: SessionPrincipal = Depends(require_session),
):
    today = datetime.date.today().isoformat()
    
    # Auto-complete daily_login
    store.update_daily_quest_progress(wallet, "daily_login", today)
    
    quests_data = store.get_daily_quests(wallet, today)
    streak = store.get_daily_streak(wallet)
    
    quests_out = []
    total_completed = 0
    total_quests = len(DAILY_QUEST_DEFINITIONS)
    
    for q_def in DAILY_QUEST_DEFINITIONS:
        # Find matching progress
        prog = next((p for p in quests_data if p.quest_id == q_def['id']), None)
        
        quests_out.append(DailyQuestOut(
            id=q_def['id'],
            title=q_def['title'],
            description=q_def['description'],
            icon=q_def['icon'],
            quest_type=q_def['quest_type'],
            required=q_def['required'],
            current_progress=prog.current_progress if prog else 0,
            completed=prog.completed if prog else False,
            reward_claimed=prog.reward_claimed if prog else False,
            reward_gold=q_def['reward_gold'],
            reward_rice=q_def['reward_rice'],
            completed_at=prog.completed_at if prog else None,
        ))
        
        if prog and prog.completed:
            total_completed += 1
            
    all_completed = (total_completed == total_quests)
    
    return DailyQuestSummaryOut(
        date=today,
        quests=quests_out,
        total_completed=total_completed,
        total_quests=total_quests,
        all_completed=all_completed,
        streak=streak,
        streak_bonus_gold=streak * 100 if streak > 0 else 0,
        streak_bonus_rice=streak * 50 if streak > 0 else 0,
    )

@router.post("/players/{wallet}/claim/{quest_id}", response_model=DailyQuestSummaryOut)
def claim_quest_reward(
    wallet: str,
    quest_id: str,
    principal: SessionPrincipal = Depends(require_session),
):
    require_wallet(principal, wallet)
    today = datetime.date.today().isoformat()
    
    prog = store.claim_daily_quest_reward(wallet, quest_id, today)
    if not prog:
        raise HTTPException(status_code=400, detail="Nhiệm vụ chưa hoàn thành hoặc đã nhận thưởng rồi")
        
    return get_daily_quests(wallet, principal)

@router.post("/players/{wallet}/claim-all", response_model=DailyQuestSummaryOut)
def claim_all_rewards(
    wallet: str,
    principal: SessionPrincipal = Depends(require_session),
):
    require_wallet(principal, wallet)
    today = datetime.date.today().isoformat()
    quests_data = store.get_daily_quests(wallet, today)
    
    total_completed = 0
    claimed_any = False
    for q in quests_data:
        if q.completed:
            total_completed += 1
            if not q.reward_claimed:
                store.claim_daily_quest_reward(wallet, q.quest_id, today)
                claimed_any = True
                
    if total_completed == len(DAILY_QUEST_DEFINITIONS):
        # All completed, give streak bonus
        streak = store.get_daily_streak(wallet)
        if streak > 0:
            player = store.find_player_any_chain(wallet)
            if player:
                player.gold += streak * 100
                player.rice += streak * 50
        
    return get_daily_quests(wallet, principal)
