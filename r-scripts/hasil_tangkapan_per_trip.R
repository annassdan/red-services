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

q_trip <- dbSendQuery(con, paste0("Select  total_tangkapan_volume as produksi, extract(month from tanggal_pendaratan) bulan, count(uuid_pendaratan) as trip
  FROM brpl_pendaratan INNER JOIN brpl_rincianpendaratan br ON brpl_pendaratan.uuid = br.uuid_pendaratan
  WHERE wpp = '",param[2],"' AND tanggal_pendaratan between BETWEEN '", param[4],"' AND '",param[5],"' 
  AND nama_lokasi_pendaratan = '",param[3],"'
  GROUP BY extract(month FROM tanggal_pendaratan), total_tangkapan_volume;"
))

trip <- dbFetch(q_trip, n=-1)
trip$produksi <- trip$produksi/1000

df_trip <- ddply(trip, .(bulan), summarise, Produksi = sum(produksi), Trip = sum(trip))
colnames(df_trip) <- c("Bulan","Produksi (Ton)","Trip")
df_trip$Bulan <- month.abb[df_trip$Bulan]
df_trip$Bulan <- factor(df_trip$Bulan, levels = month.abb)
df_trip$`Produksi (Ton)` <- as.numeric(df_trip$`Produksi (Ton)`)
df_trip$Trip <- as.numeric(df_trip$Trip)
maxy <- max(df_trip$`Produksi (Ton)`)
maxy <- roundUpNice(maxy)
maxtrip <- max(df_trip$Trip)
max <-  max(df_trip$`Produksi (Ton)`) / max(df_trip$Trip)

fig_trip <-
  ggplot(df_trip, aes(x=`Bulan`)) +
  geom_bar(aes(y= `Produksi (Ton)`), stat = 'identity', position = position_dodge(), fill = "springgreen3") +
  geom_line(aes(y= `Trip` * max, group = 1), linetype = "solid", size = 2, color = "orangered" ) +
  geom_point(aes(y= `Trip` * max), color = 'darkred', size = 3) +
  scale_y_continuous(limits = c(0,maxy) ,expand = c(0,0), sec.axis = sec_axis(~./max, name = "Jumlah Trip")) +
  #ggtitle(paste0("Hasil Tangkapan per Trip di ", lokasi," Tahun", tahun, ".")) + 
  theme_classic()
#theme(plot.title = element_text(color="black", size=14, face="bold", hjust = 0.5))

jpeg(paste0("r-scripts/images/", param[1],'.jpg'))
fig_trip
dev.off()

dbClearResult(q_trip)
