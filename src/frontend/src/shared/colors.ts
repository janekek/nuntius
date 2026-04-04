export interface IColor {
  id: number;
  name: string;
  rgb: string;
}

export class UserColor {
  // Definition der verfügbaren Farben (zentral gesteuert)
  private static readonly COLOR_MAP: Record<number, IColor> = {
    0: { id: 0, name: "YELLOW", rgb: "var(--col-primary-accent)" },
    1: { id: 1, name: "BLUE", rgb: "rgb(42, 142, 190)" },
    2: { id: 2, name: "YELLOWGREEN", rgb: "rgb(114, 180, 17)" },
    3: { id: 3, name: "GREEN", rgb: "rgb(49, 158, 86)" },
    5: { id: 5, name: "PURPLE", rgb: "rgb(154, 32, 175)" },
  };

  /**
   * Holt das Farb-Objekt basierend auf der ID aus der Datenbank.
   * Falls die ID unbekannt ist, wird die Default-Farbe (ID 0) zurückgegeben.
   */
  public static getColorById(id: number): IColor {
    return this.COLOR_MAP[id] || this.COLOR_MAP[0]!;
  }

  /**
   * Hilfsmethode, um alle verfügbaren Farben zu listen (z.B. für ein Einstellungs-Menü)
   */
  public static getAllColors(): IColor[] {
    return Object.values(this.COLOR_MAP);
  }
}
