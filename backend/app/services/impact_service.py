from typing import Dict, Any

class ImpactService:
    def calculate_impact(
        self,
        asset_id: int,
        asset_code: str,
        rated_capacity: float,
        observed_power: float,
        energy_price: float = 0.12,
        currency: str = "$",
        expected_power: float = None
    ) -> Dict[str, Any]:
        """
        Calculates generation deficit and economic impact using configurable baselines and tariffs.
        Formula:
          Estimated generation loss = expected output - observed output
          Estimated revenue impact = generation loss * configured energy value
        """
        # Prioritize telemetry expected_power if explicitly recorded; fallback to 92% rated capacity
        if expected_power is not None and expected_power > 0:
            expected_output = round(float(expected_power), 1)
            baseline_source = "telemetry_expected_power"
        else:
            expected_output = round(rated_capacity * 0.92, 1)
            baseline_source = "rated_capacity_92pct"

        generation_loss_kw = max(0.0, round(expected_output - observed_power, 2))
        deficit_pct = round((generation_loss_kw / max(expected_output, 1.0)) * 100.0, 1)

        # Hourly and daily financial projections based on operator-configured tariff
        hourly_loss = round(generation_loss_kw * energy_price, 2)
        daily_loss = round(generation_loss_kw * energy_price * 24.0, 2)

        return {
            "asset_id": asset_id,
            "asset_code": asset_code,
            "rated_capacity": rated_capacity,
            "expected_output_kw": expected_output,
            "observed_output_kw": round(observed_power, 2),
            "generation_loss_kw": generation_loss_kw,
            "deficit_pct": deficit_pct,
            "estimated_hourly_revenue_loss": hourly_loss,
            "estimated_daily_revenue_loss": daily_loss,
            "energy_price": energy_price,
            "currency": currency,
            "baseline_source": baseline_source
        }

impact_service = ImpactService()
