# Carregar dados pontuais
# Estoques são convertidos de g/m^2 para kg/m^2
mapversion <- "1.3.8"
mapbiomas <- data.table::fread("mapbiomas-rcc2022/data/pontos-lulc-carbonstock-v138.csv", sep = ",")
mapbiomas[, carbonStock := carbonStock / 1000]
# Definir limites inferior e superior para os gráficos
# O limite superior é definido de modo a criar espaço para adicionar o dado
# de cobertura e uso da terra
carbon_range <- c(0, max(mapbiomas[["carbonStock"]]))
# Dados para a legenda da cobertura e uso da terra
mapbiomas_lulc <- data.frame(
  id = unique(mapbiomas[["lulc"]]),
  class = c(
    "Formação Savânica", #4
    "Campo Alagado e Área Pantanosa", #11
    "Pastagem", #15
    "Outras Lavouras Temporárias", #41
    "Soja", #39,
    "Formação Campestre", #12
    "Mosaico de Usos", #21
    "Formação Florestal", #3
    "Outras Áreas não Vegetadas" #25
  ),
  color = c(
    "#32CD32", #4
    "#45C2A5", #11
    "#FFD966", #15
    "#e787f8", #41
    "#c59ff4", #39
    "#B8AF4F", #12
    "#FFEFC3", #21
    "#006400", #3
    "#FF99FF" #25
  )
)
# Gerar gráficos, um para cada perfil de solo
profile_id <- unique(mapbiomas[["Perfil"]])
dev.off()
for (i in rev(profile_id)) {
  tmp <- mapbiomas[Perfil %in% i, ]
  png(paste0("mapbiomas-rcc2022/res/", i, "-estoque-de-carbono.png"),
    width = 480 * 3, height = 480 * 2, res = 72 * 3)
  par(mar = c(5, 4.5, 4, 2) + 0.1)
  plot(carbonStock ~ year, data = tmp, type = "b", ylim = carbon_range,
    main = "", ylab = expression("Estoque de carbono, kg m"^-2), xlab = "Ano")
  title(sub = paste0("Samuel-Rosa, Horst & colaboradores da Rede MapBiomas (", Sys.Date(), ", versão ", mapversion, ")"),
    cex.sub = 0.6)
  grid()
  mtext(text = paste0("Perfil ", i),
    adj = 0, at = 1978, cex = 1.5, line = 2.4, font = 2)
  mtext(text = "Validação da série temporal de uso e cobertura da terra e do estoque de carbono\n nos primeiros 30 cm do solo. Foi isso mesmo que aconteceu?",
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
