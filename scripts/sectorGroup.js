class SectorGroup {
  constructor(sectors) {
    if (sectors) this.sectors = sectors;
    else this.sectors = [];
  }

  fit(sectors) {}

  insert(sector) {}

  push(sector) {
    this.sectors.push(sector);
  }
}
