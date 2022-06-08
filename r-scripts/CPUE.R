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

q_cpue <- dbSendQuery(con, paste0("select jumlah_hari_menangkap, total_tangkapan_volume, extract(month from tanggal_pendaratan) as Bulan
    from brpl_rincianpendaratan inner join brpl_pendaratan bp on bp.uuid = brpl_rincianpendaratan.uuid_pendaratan
where wpp = '",param[2],"' AND tanggal_pendaratan between BETWEEN '", param[4],"' AND '",param[5],"' 
  AND nama_lokasi_pendaratan = '",param[3],"';"))

cpue <- dbFetch(q_cpue, n=-1)
df.cpue <- ddply(cpue, .(bulan), summarise, Catch = sum(total_tangkapan_volume), daycatch = sum(jumlah_hari_menangkap))
df.cpue$Catch <- df.cpue$Catch / 1000
df.cpue$CPUE <- df.cpue$Catch / df.cpue$daycatch
df.cpue$bulan <- month.abb[df.cpue$bulan]
df.cpue$bulan <- factor(df.cpue$bulan, levels = month.abb)
maxy <- max(df.cpue$Catch)
maxy <- roundUpNice(maxy)
max <-  max(df.cpue$Catch) / max(df.cpue$CPUE)
CPUE_tahun <- sum(df.cpue$Catch) / sum(df.cpue$daycatch)
fig_cpue <-
  ggplot(df.cpue, aes(x=bulan)) +
  geom_bar(aes(y= Catch), stat = 'identity', position = position_dodge(), fill = "springgreen3") +
  geom_line(aes(y= CPUE * max, group = 1), linetype = "solid", size = 2, color = "orangered" ) +
  geom_point(aes(y= CPUE * max), color = 'darkred', size = 3) +
  scale_y_continuous(limits = c(0,maxy) ,expand = c(0,0), sec.axis = sec_axis(~./max, name = "CPUE")) +
  theme_classic()


jpeg(paste0("r-scripts/images/", param[1],'.jpg'))
fig_cpue
dev.off()

dbClearResult(q_cpue)
