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

roundUpNice <- function(x, nice=c(1,2,4,5,6,8,10)) {
  if(length(x) != 1) stop("'x' must be of length 1")
  10^floor(log10(x)) * nice[[which(x <= 10^floor(log10(x)) * nice)[[1]]]]
}


param <- commandArgs(trailingOnly=TRUE)

file_name <- param[1]
sampling_date_query <- param[2]
wpp_query <- param[3]
resource_query <- param[4]
location_query <- param[5]
db_name <- param[6]
db_host <- param[7]
db_port <- param[8]
db_user <- param[9]
db_password <- param[10]

#koneksi ke DB
con <- DBI::dbConnect(
  drv = RPostgres::Postgres(),
  dbname = db_name,
  host = db_host,
  port = db_port,
  user = db_user,
  password = db_password
)
on.exit(dbDisconnect(drv))

# Building query selector
sql_query <- paste("
  select round(cast(total_tangkapan_volume as numeric), 4) as total_tangkapan_volume, extract(month from tanggal_pendaratan) as Bulan
  from brpl_rincianpendaratan inner join brpl_pendaratan on brpl_pendaratan.uuid = brpl_rincianpendaratan.uuid_pendaratan
  where
", sampling_date_query, wpp_query, resource_query, location_query)

q_lpue <- dbSendQuery(con, sql_query)

lpue <- dbFetch(q_lpue, n=-1)
df.lpue <- ddply(lpue, .(bulan), summarise, Catch = sum(total_tangkapan_volume), trip = length(total_tangkapan_volume))
df.lpue$Catch <- df.lpue$Catch / 1000
df.lpue$LPUE <- df.lpue$Catch / df.lpue$trip
df.lpue$bulan <- month.abb[df.lpue$bulan]
df.lpue$bulan <- factor(df.lpue$bulan, levels = month.abb)

maxy <- max(df.lpue$Catch)
maxy <- roundUpNice(maxy)
max <-  max(df.lpue$Catch) / max(df.lpue$LPUE)
LPUE_tahun <- sum(df.lpue$Catch) / sum(df.lpue$trip)
fig_lpue <-
  ggplot(df.lpue, aes(x=bulan)) +
  geom_bar(aes(y= Catch), stat = 'identity', position = position_dodge(), fill = "springgreen3") +
  geom_line(aes(y= LPUE * max, group = 1), linetype = "solid", size = 2, color = "orangered" ) +
  geom_point(aes(y= LPUE * max), color = 'darkred', size = 3) +
  scale_y_continuous(limits = c(0,maxy) ,expand = c(0,0), sec.axis = sec_axis(~./max, name = "LPUE")) +
  theme_classic()

jpeg(paste0("r-scripts/images/", file_name,'.jpg'))
fig_lpue
dev.off()

dbClearResult(q_lpue)
