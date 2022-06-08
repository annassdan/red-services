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
  dbname = "e_brpl",
  host = "localhost",
  port = "5432",
  user = "postgres",
  password = "1234"
)
on.exit(dbDisconnect(drv))

q_produksi <- dbSendQuery(con, paste0("SELECT uuid_sumber_daya, total_tangkapan_volume, extract(MONTH FROM tanggal_pendaratan) bulan, uuid_alat_tangkap 
  FROM brpl_pendaratan INNER JOIN brpl_rincianpendaratan br ON brpl_pendaratan.uuid = br.uuid_pendaratan  
  WHERE wpp = '",param[2],"' AND tanggal_pendaratan between BETWEEN '", param[4],"' AND '",param[5],"' 
  AND nama_lokasi_pendaratan = '",param[3],"' AND NOT total_tangkapan_volume = 0;"))

produksi <- dbFetch(q_produksi, n=-1)
produksi$total_tangkapan_volume <- produksi$total_tangkapan_volume/1000

df_alattangkap <- ddply(produksi, .(uuid_alat_tangkap), summarise, Produksi = sum(total_tangkapan_volume))
colnames(df_alattangkap) <- c("Alat Tangkap","Produksi (Ton)")
maxy <- max(df_alattangkap$`Produksi (Ton)`)
maxy <- roundUpNice(maxy)
fig_alattangkap <-
  ggplot(df_alattangkap, aes(x=`Alat Tangkap`, y= `Produksi (Ton)`)) +
  geom_bar(width = 0.5 ,stat = 'identity', position = position_dodge(), fill='lightblue3') +
  scale_y_continuous(limits = c(0,maxy) ,expand = c(0,0)) +
  theme_classic()
  
jpeg(paste0("r-scripts/images/", param[1],'.jpg'))
fig_alattangkap
dev.off()

dbClearResult(q_produksi)
