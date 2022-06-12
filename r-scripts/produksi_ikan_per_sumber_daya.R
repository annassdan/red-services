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
setwd("C:/R/BRPL/")

#remoce all object
# rm(list=ls())

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

q_produksi <- dbSendQuery(con, paste0("SELECT uuid_sumber_daya, total_tangkapan_volume, extract(MONTH FROM tanggal_pendaratan) bulan, uuid_alat_tangkap 
  FROM brpl_pendaratan INNER JOIN brpl_rincianpendaratan br ON brpl_pendaratan.uuid = br.uuid_pendaratan  
  WHERE wpp = '",param[2],"' AND tanggal_pendaratan between BETWEEN '", param[4],"' AND '",param[5],"' 
  AND nama_lokasi_pendaratan = '",param[3],"' AND NOT total_tangkapan_volume = 0;"))

produksi <- dbFetch(q_produksi, n=-1)
produksi$total_tangkapan_volume <- produksi$total_tangkapan_volume/1000

df_sumberdaya <- ddply(produksi, .(uuid_sumber_daya, bulan), summarise, Produksi = sum(total_tangkapan_volume))
colnames(df_sumberdaya) <- c("Sumber Daya","Bulan","Produksi (Ton)")
df_sumberdaya$Bulan <- month.abb[df_sumberdaya$Bulan]
df_sumberdaya$Bulan <- factor(df_sumberdaya$Bulan, levels = month.abb)
roundUpNice <- function(x, nice=c(1,2,4,5,6,8,10)) {
  if(length(x) != 1) stop("'x' must be of length 1")
  10^floor(log10(x)) * nice[[which(x <= 10^floor(log10(x)) * nice)[[1]]]]
}
maxy <- max(df_sumberdaya$`Produksi (Ton)`)
maxy <- roundUpNice(maxy)

fig_produksi <-
  ggplot(df_sumberdaya, aes(x=`Bulan`, y= `Produksi (Ton)`, fill = `Sumber Daya`)) +
  geom_bar(stat = 'identity', position = position_dodge()) +
  scale_y_continuous(limits = c(0,maxy) ,expand = c(0,0)) +
  scale_fill_brewer(palette="Set2")+
  theme_classic()


jpeg(paste0("r-scripts/images/", param[1],'.jpg'))
fig_produksi
dev.off()

dbClearResult(q_produksi)
