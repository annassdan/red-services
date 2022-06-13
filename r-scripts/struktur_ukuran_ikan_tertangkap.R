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

roundUpNice <- function(x, nice = c(1, 2, 4, 5, 6, 8, 10)) {
  if (length(x) != 1) stop("'x' must be of length 1")
  10^floor(log10(x)) * nice[[which(x <= 10^floor(log10(x)) * nice)[[1]]]]
}

param <- commandArgs(trailingOnly = TRUE)

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

file_name <- param[1]
sampling_date_query <- param[2]
wpp_query <- param[3]
resource_query <- param[4]
location_query <- param[5]
species_query <- param[6]
length_query <- param[7]

# Building query selector
sql_query <- paste("
  with source as (select round(cast(panjang as numeric), 4) as panjang
                from brpl_biologiukuran
                         inner join brpl_biologiukurandetail
                                    on brpl_biologiukuran.uuid = brpl_biologiukurandetail.uuid_biologiukuran
                where ",
                   sampling_date_query, wpp_query, resource_query, location_query, species_query, length_query
  , ") select DISTINCT panjang, count(panjang) as jumlah
  from source group by panjang")

q_freq_ukuran <- dbSendQuery(con, sql_query)

ukuran <- dbFetch(q_freq_ukuran, n = -1)
ukuran$panjang_2 <- as.numeric(round(ukuran$panjang))
ukuran$panjang_2[ukuran$panjang_2 %% 2 == 1] <- ukuran$panjang_2[ukuran$panjang_2 %% 2 == 1] - 1
df <- data.frame(aggregate(x = ukuran$jumlah, by = list(ukuran$panjang_2), FUN = "sum"))
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
    scale_y_continuous(limits = c(0, maxy), expand = c(0, 0)) +
    scale_x_continuous(breaks = seq(minx, maxx, by = 4), expand = c(0, 0)) +
    #ggtitle(paste0(species,". ", lokasi,". ", tahun)) +
    theme_classic()
#theme(plot.title = element_text(color="black", size=14, face="bold", hjust = 0.5))

jpeg(paste0("r-scripts/images/", file_name, '.jpg'))
fig_ukuran
dev.off()

dbClearResult(q_freq_ukuran)
