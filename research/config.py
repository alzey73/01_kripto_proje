"""Araştırma konfigürasyonu. Tüm deney parametreleri burada tek yerde tutulur."""
from dataclasses import dataclass, field, asdict


@dataclass
class Config:
    # --- Veri ---
    interval: str = "1h"                 # Mum aralığı (1h, 4h ...)
    start: str = "2021-01"               # İndirilecek ilk ay (YYYY-MM)
    data_dir: str = "data"
    quote_asset: str = "USDT"
    min_median_quote_volume: float = 200_000.0  # Mum başına medyan USDT hacmi (likidite filtresi)
    min_history_bars: int = 24 * 120     # Bir coinin dahil edilmesi için gereken minimum mum sayısı

    # --- Etiket (triple barrier) ---
    side: str = "long"                   # "long" veya "short"
    tp_mult: float = 1.5                 # Hedef = giriş ± tp_mult * ATR%
    sl_mult: float = 1.5                 # Stop  = giriş ∓ sl_mult * ATR%
    horizon: int = 24                    # Maksimum bekleme süresi (mum)
    fee_per_side: float = 0.001          # Binance spot komisyonu (%0.1)
    slippage_per_side: float = 0.0005    # Kayma tahmini

    # --- Walk-forward ---
    min_train_months: int = 12           # İlk eğitim penceresi
    test_months: int = 3                 # Her katmandaki test süresi
    calib_months: int = 3                # Eğitimin sonundan ayrılan kalibrasyon dilimi
    lockbox_months: int = 6              # En sondaki, geliştirme sırasında HİÇ bakılmayan dönem
    train_sample_frac: float = 1.0       # Hız için eğitim verisinden örnekleme oranı

    # --- Sinyal seçimi ---
    report_thresholds: tuple = (0.55, 0.60, 0.65, 0.70, 0.75, 0.80)
    top_quantiles: tuple = (0.01, 0.005, 0.001)   # Kalibrasyon diliminde belirlenen üst dilimler
    n_null_trials: int = 1000            # Rastgele seçim testi tekrar sayısı

    # --- Model ---
    lgbm_params: dict = field(default_factory=lambda: dict(
        n_estimators=400, learning_rate=0.03, num_leaves=31, min_child_samples=500,
        subsample=0.7, subsample_freq=1, colsample_bytree=0.7, reg_lambda=5.0,
        verbose=-1, n_jobs=-1,
    ))
    seed: int = 42

    @property
    def round_trip_cost(self) -> float:
        return 2 * (self.fee_per_side + self.slippage_per_side)

    def to_dict(self):
        return asdict(self)
