# Carregar dados pontuais
# Estoques são convertidos de g/m^2 para kg/m^2
mapbiomas <- data.table::fread("mapbiomas-rcc2022/data/pontos-lulc-carbonstock-v1.csv", sep = ",")
mapbiomas[, carbonStock := carbonStock / 1000]
# Definir limites inferior e superior para os gráficos
# O limite superior é definido de modo a criar espaço para adicionar o dado
# de cobertura e uso da terra
carbon_range <- c(0, max(mapbiomas[["carbonStock"]]))
# Dados para a legenda da cobertura e uso da terra
mapbiomas_lulc <- data.frame(
  id = unique(mapbiomas[["lulc"]]),
  class = c(
    "Campo Alagado e Área Pantanosa",
    "Mosaico de Usos",
    "Arroz",
    "Soja",
    "Pastagem",
    "Formação Savânica",
    "Formação Campestre",
    "Outras Áreas não Vegetadas",
    "Formação Florestal"
  ),
  color = c(
    "#45C2A5",
    "#FFEFC3",
    "#982c9e",
    "#c59ff4",
    "#FFD966",
    "#32CD32",
    "#B8AF4F",
    "#FF99FF",
    "#006400"
  )
)
# Gerar gráficos, um para cada perfil de solo
profile_id <- unique(mapbiomas[["perfil"]])
dev.off()
for (i in rev(profile_id)) {
  tmp <- mapbiomas[perfil %in% i, ]
  png(paste0("mapbiomas-rcc2022/res/", i, "-estoque-de-carbono.png"), width = 480 * 3, height = 480 * 2, res = 72 * 3)
  par(mar = c(5, 4.5, 4, 2) + 0.1)
  plot(carbonStock ~ year, data = tmp, type = "b", ylim = carbon_range,
    main = "", ylab = expression("Estoque de carbono, kg m"^-2), xlab = "Ano")
  title(sub = Sys.Date(), cex.sub = 0.75)
  grid()
  mtext(text = paste0("Perfil ", i),
    adj = 0, at = 1978, cex = 1.5, line = 2.4, font = 2)
  mtext(text = "Variação temporal do estoque de carbono nos primeiros 30 cm do solo em função da\ncobertura e uso da terra segundo dados da Coleção 7 do MapBiomas.",
    adj = 0, at = 1978, cex = 1, line = 0.3, font = 1)
  lulc_idx <- match(tmp[["lulc"]], mapbiomas_lulc[["id"]])
  points(x = tmp[["year"]], y = rep(0, nrow(tmp)), pch = 15, cex = 1.9,
    col = mapbiomas_lulc[["color"]][lulc_idx])
  lulc_class <- mapbiomas_lulc[["class"]][lulc_idx]
  is_duplicated <- duplicated(lulc_class)
  lulc_class <- ifelse(is_duplicated, NA_character_, lulc_class)
  idx_notna <- which(!is.na(lulc_class))
  y <- rep(0.5, nrow(tmp))
  y[idx_notna] <- y[idx_notna] * seq_along(idx_notna)
  text(x = tmp[["year"]], y = y, labels = lulc_class,
    cex = 0.75, pos = 4, offset = 0)
  dev.off()
}


