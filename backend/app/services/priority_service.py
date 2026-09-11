from typing import List, Dict, Any

class PriorityService:
    def rank_assets(
        self,
        asset_summaries: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Deterministic ranking logic (Section 7):
        Priority Score = (Health Penalty * 0.40) + (Persistence Factor * 0.20) + (Daily Revenue Risk Factor * 0.25) + (Capacity Factor * 0.15)
        """
        scored_items = []
        for asset in asset_summaries:
            health = asset.get("health_score", 100.0)
            health_penalty = 100.0 - health

            # Risk weight
            risk_level = asset.get("risk_level", "HEALTHY")
            risk_multiplier = {
                "CRITICAL": 1.5,
                "HIGH RISK": 1.2,
                "WATCH": 0.8,
                "HEALTHY": 0.2,
                "DATA_STALE": 0.9
            }.get(risk_level, 0.5)

            persistence_hours = asset.get("persistence_hours", 1.0)
            persistence_factor = min(persistence_hours * 10.0, 50.0)

            daily_rev_risk = asset.get("estimated_revenue_loss_daily", 0.0)
            # Normalize daily revenue loss up to $500
            revenue_factor = min((daily_rev_risk / 500.0) * 50.0, 50.0)

            capacity = asset.get("rated_capacity", 100.0)
            capacity_factor = min((capacity / 200.0) * 20.0, 20.0)

            priority_score = (health_penalty * 0.45 * risk_multiplier) + (persistence_factor * 0.20) + (revenue_factor * 0.25) + (capacity_factor * 0.10)
            priority_score = round(priority_score, 1)

            # Recommend action
            if risk_level == "CRITICAL":
                rec = "Immediate on-site dispatch. Inspect gearbox, bearing vibrations and thermal dissipation."
            elif risk_level == "HIGH RISK":
                rec = "Schedule priority maintenance inspection within 24-48 hours."
            elif risk_level == "WATCH":
                rec = "Flag for monitoring in next scheduled maintenance cycle."
            elif risk_level == "DATA_STALE":
                rec = "Telemetry link issue. Inspect gateway transmitter."
            else:
                rec = "Routine operation. No action needed."

            scored_items.append({
                **asset,
                "priority_score": priority_score,
                "recommended_action": rec
            })

        # Sort descending by priority_score
        scored_items.sort(key=lambda x: x["priority_score"], reverse=True)

        # Assign rank 1..N
        for idx, item in enumerate(scored_items, start=1):
            item["rank"] = idx

        return scored_items

priority_service = PriorityService()
