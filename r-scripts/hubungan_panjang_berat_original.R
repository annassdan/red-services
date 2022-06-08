library(Hmisc)
library(doBy)
library(gdata)
library(ggplot2)
library(ggpmisc)
library(ggmap)
library(RPostgreSQL)
library(memisc)
library(gmodels)
library(plyr)
library(dplyr)
library(RcppEigen)
library(lme4)
library(bootstrap)
library(fishmethods)
library(TropFishR)
library(stargazer)
library(data.table)
library(fishmethods)
library(kableExtra)
library(scales)
library(viridis)

options(echo = TRUE)
# setwd("C:/R/BRPL/")

#remoce all object
rm(list=ls())

param = commandArgs(trailingOnly=TRUE)

#koneksi ke DB
con <- DBI::dbConnect(
  drv = RPostgres::Postgres(),
  dbname = "e_brpl",
  host = "localhost",
  port = "5432",
  user = "postgres",
  password = "1234"
)
on.exit(dbDisconnect(drv))

other_species = ""
if (length(param)>11) {
  for (y in 12: length(param))
  {
    other_species = paste0(other_species,"OR uuid_spesies = '",param[y],"' ")
  }
}

q_panjangberat <- dbSendQuery(con, paste0("SELECT panjang, berat
  FROM brpl_biologireproduksidetail INNER JOIN brpl_biologireproduksi bb on bb.uuid = brpl_biologireproduksidetail.uuid_biologireproduksi
  WHERE wpp = '",param[2],"' AND tanggal_sampling between BETWEEN '", param[4],"' AND '",param[5],"' 
  AND nama_lokasi_sampling = '",param[3],"' AND uuid_sumber_daya = '", param[6],"' 
  AND panjang BETWEEN '",param[7],"' AND '",param[8],"'
  AND berat BETWEEN '",param[9],"' And '",param[10],"'
  AND uuid_species = '",param[11],"' ",other_species,";"
))

panjangberat <- dbFetch(q_panjangberat, n=-1)
colnames(panjangberat) <- c("Panjang","Berat (gram)")

fig_panjangberat <-
  ggplot(panjangberat, aes(x = Panjang, y = `Berat (gram)`)) +
  geom_point() +
  stat_smooth(method = 'lm', size = 1.5, se = F, formula = y ~ x) +
  stat_poly_eq(formula = y~x, 
               aes(label = paste(..eq.label.., ..rr.label.., sep = "~~~")), 
               parse = TRUE) +
  theme_classic()
reg1 <- lm(panjangberat$`Berat (gram)`~ panjangberat$Panjang, data = panjangberat)
r2 <- summary(reg1)$adj.r.squared

jpeg(paste0("r-scripts/images/", param[1],'.jpg'))
fig_panjangberat
dev.off()

dbClearResult(q_panjangberat)
