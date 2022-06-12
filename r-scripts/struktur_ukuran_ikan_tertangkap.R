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
  dbname = "e_brpl_2",
  host = "localhost",
  port = "5432",
  user = "postgres",
  password = "talasbogor"
)
on.exit(dbDisconnect(drv))

other_species = ""
if (length(param)>9) {
  for (y in 10: length(param))
  {
    other_species = paste0(other_species," OR uuid_spesies = '",param[y],"' ")
  }
}

q_freq_ukuran <- dbSendQuery(con, paste0("SELECT DISTINCT panjang, count(panjang) AS jumlah 
  FROM brpl_biologiukuran INNER JOIN brpl_biologiukurandetail bb ON brpl_biologiukuran.uuid = bb.uuid_biologiukuran
  INNER JOIN brpl_biologiukuranrinciansample b ON brpl_biologiukuran.uuid = b.uuid_biologiukuran
  WHERE wpp = '", param[2],"' AND tanggal_sampling between BETWEEN '", param[4],"' AND '",param[5],"' 
  AND nama_lokasi_sampling = '",param[3],"' AND uuid_sumber_daya = '", param[6],"' 
  AND panjang BETWEEN '",param[7],"' AND '",param[8],"'
  AND uuid_species = '",param[9],"' ",other_species,"
  GROUP BY panjang;"))

ukuran <- dbFetch(q_freq_ukuran, n=-1)
ukuran$panjang_2 <- as.numeric(round(ukuran$panjang))
ukuran$panjang_2[ukuran$panjang_2 %% 2 == 1] <- ukuran$panjang_2[ukuran$panjang_2 %% 2 == 1] - 1 
df = data.frame(aggregate(x = ukuran$jumlah, by = list(ukuran$panjang_2), FUN = "sum"))
colnames(df) <- c("Panjang", "Frekuensi")
minx <- as.numeric(min(df$Panjang))
maxx <- as.numeric(max(df$Panjang))
maxx <- roundUpNice(maxx)
miny <- as.numeric(min(df$Frekuensi))
maxy <- as.numeric(max(df$Frekuensi))
maxy <- roundUpNice(maxy)
panjang_freq <- df$Panjang[df$Frekuensi == maxy]

fig_ukuran <-
  ggplot(df, aes(Panjang)) +
  geom_col(aes(y = Frekuensi), fill = 'springgreen3') +
  scale_y_continuous(limits= c(0,maxy), expand = c(0,0)) +
  scale_x_continuous(breaks = seq(minx, maxx, by = 4), expand = c(0,0)) +
  #ggtitle(paste0(species,". ", lokasi,". ", tahun)) + 
  theme_classic()
#theme(plot.title = element_text(color="black", size=14, face="bold", hjust = 0.5))

jpeg(paste0("r-scripts/images/", param[1],'.jpg'))
fig_ukuran
dev.off()

dbClearResult(q_freq_ukuran)
